#!/usr/bin/env python3
"""

Author: Nguyen Dinh Anh Tuan
Created: 2025-11-28
Modified: 2025-11-28
Version: 1.0.0
License: MIT

Phân tích issues từ EXECUTION_ORDER.md và tìm issues thiếu trong các file PERSON_X_ISSUES_STRATEGY.md
"""

import re
from pathlib import Path

def extract_issues_from_execution_order():
    """Trích xuất tất cả issues từ EXECUTION_ORDER.md"""
    execution_file = Path("EXECUTION_ORDER.md")
    content = execution_file.read_text(encoding='utf-8')
    
    # Pattern để tìm issues
    pattern = r'- Issue #(\d+): \[([A-Z]+)\] (.+?) \(Person (\d)\)'
    matches = re.findall(pattern, content)
    
    issues_by_person = {1: [], 2: [], 3: []}
    
    for match in matches:
        issue_num, issue_type, title, person = match
        issues_by_person[int(person)].append({
            'number': int(issue_num),
            'type': issue_type,
            'title': title
        })
    
    return issues_by_person

def extract_existing_issues(person_num):
    """Trích xuất issues hiện có từ PERSON_X_ISSUES_STRATEGY.md"""
    strategy_file = Path(f"PERSON_{person_num}_ISSUES_STRATEGY.md")
    
    if not strategy_file.exists():
        return []
    
    content = strategy_file.read_text(encoding='utf-8')
    
    # Pattern để tìm issues trong file strategy
    pattern = r'#### Issue #(\d+): \[([A-Z]+)\] (.+)'
    matches = re.findall(pattern, content)
    
    existing_issues = []
    for match in matches:
        existing_issues.append(int(match[0]))
    
    return existing_issues

def main():
    print("="*80)
    print(" PHÂN TÍCH ISSUES TRONG EXECUTION_ORDER.MD")
    print("="*80)
    
    # Lấy issues từ EXECUTION_ORDER.md
    all_issues = extract_issues_from_execution_order()
    
    print("\n📊 TỔNG HỢP ISSUES THEO PERSON:\n")
    
    for person_num in [1, 2, 3]:
        issues = all_issues[person_num]
        existing = extract_existing_issues(person_num)
        
        print(f"\n{'='*80}")
        print(f" PERSON {person_num}")
        print(f"{'='*80}")
        
        print(f"\n✅ Issues trong EXECUTION_ORDER.md: {len(issues)}")
        print(f"📋 Issues hiện có trong PERSON_{person_num}_ISSUES_STRATEGY.md: {len(existing)}")
        
        # Tìm issues thiếu
        expected_numbers = [issue['number'] for issue in issues]
        missing = set(expected_numbers) - set(existing)
        
        if missing:
            print(f"\n❌ THIẾU {len(missing)} ISSUES:")
            missing_sorted = sorted(missing)
            for num in missing_sorted:
                issue_info = next(i for i in issues if i['number'] == num)
                print(f"   - Issue #{num}: [{issue_info['type']}] {issue_info['title']}")
        else:
            print(f"\n✅ ĐẦY ĐỦ! Tất cả issues đã có trong file strategy.")
        
        print(f"\n📝 DANH SÁCH ĐẦY ĐỦ ISSUES CỦA PERSON {person_num}:")
        for issue in sorted(issues, key=lambda x: x['number']):
            status = "✅" if issue['number'] in existing else "❌"
            print(f"   {status} Issue #{issue['number']}: [{issue['type']}] {issue['title']}")
    
    print(f"\n{'='*80}")
    print(" HOÀN TẤT PHÂN TÍCH")
    print(f"{'='*80}\n")

if __name__ == "__main__":
    main()
