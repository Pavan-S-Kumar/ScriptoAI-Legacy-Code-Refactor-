#!/usr/bin/env python3
"""
Sample Python project for legacy code analyzer demo.
This file intentionally contains some common code issues.
"""

import os
import sys
import json
from typing import Optional

# Issue: Hardcoded credentials (security)
DATABASE_PASSWORD = "admin123"
API_KEY = "sk-1234567890abcdef"

def get_user_data(user_id: int) -> dict:
    """Fetch user data from database."""
    # Issue: SQL injection vulnerability
    query = f"SELECT * FROM users WHERE id = {user_id}"
    print(f"Executing query: {query}")
    return {"id": user_id, "name": "Demo User"}

def process_input(user_input: str) -> str:
    """Process user input."""
    # Issue: Using eval with untrusted input
    result = eval(user_input)
    return str(result)

def calculate_score(items: list) -> float:
    """Calculate total score from items."""
    total = 0
    # Issue: Magic number
    for item in items:
        if item > 100:
            total += item * 1.5
        elif item > 50:
            total += item * 1.2
        else:
            total += item
    return total

# Issue: Unused import (sys)
def main():
    print("Legacy Code Analyzer Demo")
    data = get_user_data(1)
    print(f"User: {data}")

if __name__ == "__main__":
    main()
