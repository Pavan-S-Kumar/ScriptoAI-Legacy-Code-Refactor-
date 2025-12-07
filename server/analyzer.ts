import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { GoogleGenAI } from "@google/genai";
import AdmZip from "adm-zip";

const execAsync = promisify(exec);

// Using Gemini API (blueprint:javascript_gemini)
// Note: the newest Gemini model series is "gemini-2.5-flash" or "gemini-2.5-pro"
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface Issue {
  severity: "critical" | "major" | "minor";
  file: string;
  line: number;
  message: string;
  rule: string;
  suggestion?: string;
}

interface RefactoredFile {
  file: string;
  original: string;
  refactored: string;
}

interface AnalysisResult {
  request_id: string;
  status: string;
  summary: {
    languages: string[];
    total_files_analyzed: number;
    issues_count: {
      critical: number;
      major: number;
      minor: number;
    };
  };
  issues: Issue[];
  patches: Array<{
    file: string;
    original: string;
    corrected: string;
  }>;
  refactoredFiles: RefactoredFile[];
}

async function extractZip(zipBuffer: Buffer, destDir: string): Promise<void> {
  try {
    const zip = new AdmZip(zipBuffer);
    zip.extractAllTo(destDir, true);
  } catch (error) {
    console.error("Error extracting zip:", error);
    throw new Error("Failed to extract ZIP file");
  }
}

async function cloneRepo(repoUrl: string, destDir: string): Promise<void> {
  try {
    await execAsync(`git clone --depth 1 "${repoUrl}" "${destDir}"`, { 
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024 
    });
  } catch (error) {
    console.error("Error cloning repo:", error);
    throw new Error("Failed to clone repository");
  }
}

async function findFiles(dir: string, extensions: string[]): Promise<string[]> {
  const files: string[] = [];
  
  async function walk(currentDir: string) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "__pycache__" || entry.name === "venv" || entry.name === ".git") {
          continue;
        }
        
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`Error walking directory ${currentDir}:`, error);
    }
  }
  
  await walk(dir);
  return files;
}

async function analyzeFileWithGemini(
  fileContent: string,
  relativePath: string,
  language: string
): Promise<Issue[]> {
  const systemPrompt = `You are an expert code analyzer. Analyze the given ${language} code and identify issues.

For each issue found, provide a JSON array with objects containing:
- severity: "critical" (bugs, security issues, syntax errors), "major" (logic errors, bad practices), or "minor" (style, formatting)
- line: the line number where the issue occurs (integer)
- message: brief description of the issue
- rule: a rule identifier like "${language}/issue-type"
- suggestion: how to fix the issue

Only include real, actionable issues. Be thorough but avoid false positives.
Return ONLY a valid JSON array, no markdown or explanations.
If no issues are found, return an empty array: []`;

  const userPrompt = `Analyze this ${language} file for issues:

File: ${relativePath}

\`\`\`${language}
${fileContent}
\`\`\`

Return a JSON array of issues found.`;

  try {
    console.log(`Analyzing file with Gemini: ${relativePath}`);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: systemPrompt + "\n\n" + userPrompt }]
        }
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    console.log(`Gemini raw response for ${relativePath}:`, JSON.stringify(response).substring(0, 300));
    
    let responseText = "";
    if (response.text) {
      responseText = response.text;
    } else if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
      responseText = response.candidates[0].content.parts[0].text;
    } else {
      console.error(`No text found in Gemini response for ${relativePath}`);
      return [];
    }
    
    console.log(`Gemini analysis response for ${relativePath}:`, responseText.substring(0, 500));
    const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const parsedIssues = JSON.parse(cleanedResponse);
      
      if (Array.isArray(parsedIssues)) {
        console.log(`Found ${parsedIssues.length} issues in ${relativePath}`);
        return parsedIssues.map((issue: any) => ({
          severity: issue.severity === "critical" || issue.severity === "major" || issue.severity === "minor" 
            ? issue.severity 
            : "minor",
          file: relativePath,
          line: typeof issue.line === 'number' ? issue.line : 1,
          message: issue.message || "Unknown issue",
          rule: issue.rule || `${language}/gemini-detected`,
          suggestion: issue.suggestion || ""
        }));
      } else {
        console.error(`Gemini response is not an array for ${relativePath}:`, typeof parsedIssues);
      }
    } catch (parseError) {
      console.error(`Error parsing Gemini response for ${relativePath}:`, parseError);
      console.error(`Raw response was:`, cleanedResponse.substring(0, 500));
    }
  } catch (error) {
    console.error(`Error analyzing file ${relativePath} with Gemini:`, error);
  }
  
  return [];
}

async function analyzeFilesWithGemini(
  files: string[],
  baseDir: string,
  language: string
): Promise<Issue[]> {
  const allIssues: Issue[] = [];
  
  for (const file of files) {
    const relativePath = path.relative(baseDir, file);
    
    try {
      const content = await fs.readFile(file, 'utf-8');
      const issues = await analyzeFileWithGemini(content, relativePath, language);
      allIssues.push(...issues);
    } catch (error) {
      console.error(`Error reading file ${file}:`, error);
    }
  }
  
  return allIssues;
}

async function analyzePythonFiles(files: string[], baseDir: string): Promise<Issue[]> {
  return analyzeFilesWithGemini(files, baseDir, "python");
}

async function analyzeJavaScriptFiles(files: string[], baseDir: string): Promise<Issue[]> {
  return analyzeFilesWithGemini(files, baseDir, "javascript");
}

async function analyzeTypeScriptFiles(files: string[], baseDir: string): Promise<Issue[]> {
  return analyzeFilesWithGemini(files, baseDir, "typescript");
}

async function refactorFileWithGemini(
  filePath: string, 
  fileContent: string, 
  issues: Issue[], 
  relativePath: string
): Promise<string> {
  const fileIssues = issues.filter(i => i.file === relativePath);
  
  const issuesSummary = fileIssues.length > 0 
    ? fileIssues.map(i => `- Line ${i.line}: ${i.message} (${i.severity})`).join('\n')
    : 'No specific issues detected';

  const systemPrompt = `You are an expert code refactoring assistant. Your task is to improve the given code by:
1. Fixing all detected issues and bugs
2. Improving code readability and structure
3. Following best practices for the programming language
4. Removing unused imports and variables
5. Adding appropriate comments where helpful
6. Maintaining the original functionality

IMPORTANT: Return ONLY the refactored code, with no explanations, markdown formatting, or code blocks. The output should be valid code that can be directly saved to a file.`;

  const userPrompt = `Here is a code file that needs refactoring:

File: ${relativePath}

Detected Issues:
${issuesSummary}

Original Code:
${fileContent}

Please provide the refactored version of this code.`;

  try {
    console.log(`Refactoring file with Gemini: ${relativePath}`);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: systemPrompt + "\n\n" + userPrompt }]
        }
      ],
    });

    let refactoredCode = "";
    if (response.text) {
      refactoredCode = response.text;
    } else if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
      refactoredCode = response.candidates[0].content.parts[0].text;
    } else {
      console.error(`No text found in Gemini refactor response for ${relativePath}`);
      return fileContent;
    }
    
    refactoredCode = refactoredCode.replace(/^```[\w]*\n?/g, '').replace(/\n?```$/g, '').trim();
    console.log(`Gemini refactored ${relativePath}, output length: ${refactoredCode.length}`);
    return refactoredCode;
  } catch (error) {
    console.error(`Error refactoring file ${relativePath}:`, error);
    return fileContent;
  }
}

async function refactorFiles(
  files: string[], 
  baseDir: string, 
  issues: Issue[]
): Promise<RefactoredFile[]> {
  const refactoredFiles: RefactoredFile[] = [];
  
  for (const file of files) {
    const relativePath = path.relative(baseDir, file);
    
    try {
      const content = await fs.readFile(file, 'utf-8');
      
      const refactoredContent = await refactorFileWithGemini(file, content, issues, relativePath);
      
      refactoredFiles.push({
        file: relativePath,
        original: content,
        refactored: refactoredContent
      });
    } catch (error) {
      console.error(`Error reading file ${file}:`, error);
    }
  }
  
  return refactoredFiles;
}

export async function analyzeCode(
  requestId: string,
  zipBuffer?: Buffer,
  repoUrl?: string,
  analysisMode: string = "standard"
): Promise<AnalysisResult> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "code-analysis-"));
  
  try {
    if (zipBuffer) {
      await extractZip(zipBuffer, tempDir);
    } else if (repoUrl) {
      await cloneRepo(repoUrl, tempDir);
    } else {
      throw new Error("No code provided for analysis");
    }
    
    const pythonFiles = await findFiles(tempDir, [".py"]);
    const jsFiles = await findFiles(tempDir, [".js", ".jsx", ".mjs"]);
    const tsFiles = await findFiles(tempDir, [".ts", ".tsx"]);
    
    const languages: string[] = [];
    if (pythonFiles.length > 0) languages.push("python");
    if (jsFiles.length > 0) languages.push("javascript");
    if (tsFiles.length > 0) languages.push("typescript");
    
    let allIssues: Issue[] = [];
    
    if (pythonFiles.length > 0) {
      const pythonIssues = await analyzePythonFiles(pythonFiles, tempDir);
      allIssues = [...allIssues, ...pythonIssues];
    }
    
    if (jsFiles.length > 0) {
      const jsIssues = await analyzeJavaScriptFiles(jsFiles, tempDir);
      allIssues = [...allIssues, ...jsIssues];
    }
    
    if (tsFiles.length > 0) {
      const tsIssues = await analyzeTypeScriptFiles(tsFiles, tempDir);
      allIssues = [...allIssues, ...tsIssues];
    }
    
    if (analysisMode === "quick") {
      allIssues = allIssues.filter(i => i.severity === "critical" || i.severity === "major");
    }
    
    const issuesCount = {
      critical: allIssues.filter(i => i.severity === "critical").length,
      major: allIssues.filter(i => i.severity === "major").length,
      minor: allIssues.filter(i => i.severity === "minor").length
    };
    
    const allFiles = [...pythonFiles, ...jsFiles, ...tsFiles];
    const refactoredFiles = await refactorFiles(allFiles, tempDir, allIssues);
    
    return {
      request_id: requestId,
      status: "completed",
      summary: {
        languages,
        total_files_analyzed: pythonFiles.length + jsFiles.length + tsFiles.length,
        issues_count: issuesCount
      },
      issues: allIssues,
      patches: [],
      refactoredFiles
    };
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error("Error cleaning up temp directory:", error);
    }
  }
}

export function generateReport(result: AnalysisResult): string {
  let report = `# Code Analysis Report\n\n`;
  report += `**Request ID:** ${result.request_id}\n`;
  report += `**Status:** ${result.status}\n`;
  report += `**Date:** ${new Date().toISOString()}\n\n`;
  
  report += `## Summary\n\n`;
  report += `- **Languages Detected:** ${result.summary.languages.join(", ") || "None"}\n`;
  report += `- **Total Files Analyzed:** ${result.summary.total_files_analyzed}\n`;
  report += `- **Critical Issues:** ${result.summary.issues_count.critical}\n`;
  report += `- **Major Issues:** ${result.summary.issues_count.major}\n`;
  report += `- **Minor Issues:** ${result.summary.issues_count.minor}\n\n`;
  
  if (result.issues.length > 0) {
    report += `## Issues Found\n\n`;
    
    const criticalIssues = result.issues.filter(i => i.severity === "critical");
    const majorIssues = result.issues.filter(i => i.severity === "major");
    const minorIssues = result.issues.filter(i => i.severity === "minor");
    
    if (criticalIssues.length > 0) {
      report += `### Critical Issues\n\n`;
      for (const issue of criticalIssues) {
        report += `- **${issue.file}:${issue.line}** - ${issue.message}\n`;
        report += `  - Rule: \`${issue.rule}\`\n`;
        if (issue.suggestion) {
          report += `  - Suggestion: ${issue.suggestion}\n`;
        }
        report += `\n`;
      }
    }
    
    if (majorIssues.length > 0) {
      report += `### Major Issues\n\n`;
      for (const issue of majorIssues) {
        report += `- **${issue.file}:${issue.line}** - ${issue.message}\n`;
        report += `  - Rule: \`${issue.rule}\`\n`;
        if (issue.suggestion) {
          report += `  - Suggestion: ${issue.suggestion}\n`;
        }
        report += `\n`;
      }
    }
    
    if (minorIssues.length > 0) {
      report += `### Minor Issues\n\n`;
      for (const issue of minorIssues) {
        report += `- **${issue.file}:${issue.line}** - ${issue.message}\n`;
        report += `  - Rule: \`${issue.rule}\`\n`;
        if (issue.suggestion) {
          report += `  - Suggestion: ${issue.suggestion}\n`;
        }
        report += `\n`;
      }
    }
  } else {
    report += `## No Issues Found\n\n`;
    report += `Congratulations! Your code passed all static analysis checks.\n`;
  }
  
  return report;
}

export function generateJSON(result: AnalysisResult): string {
  return JSON.stringify(result, null, 2);
}
