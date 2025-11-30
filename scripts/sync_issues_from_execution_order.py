#!/usr/bin/env python3
"""Issues Synchronization Script.

Module: scripts.sync_issues_from_execution_order
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-28
Modified: 2025-11-28
Version: 1.0.0
License: MIT

Description:
    Synchronizes issues from EXECUTION_ORDER.md to individual
    PERSON_X_ISSUES_STRATEGY.md files for team coordination.
    Maintains consistency across project management documentation.
"""

import re

# Mapping đầy đủ từ EXECUTION_ORDER.md
EXECUTION_ORDER_ISSUES = {
    # Person 1
    5: {
        'person': 1,
        'type': 'FEATURE',
        'title': 'Centralized logging and configuration system',
        'created': 'Day 2 Morning',
        'status': 'Closed'
    },
    6: {
        'person': 1,
        'type': 'FEATURE',
        'title': 'Add data utilities and helper functions',
        'created': 'Day 2 Morning',
        'status': 'Closed'
    },
    7: {
        'person': 1,
        'type': 'FEATURE',
        'title': 'Multi-agent orchestration engine',
        'created': 'Day 2 Afternoon',
        'status': 'Closed'
    },
    8: {
        'person': 1,
        'type': 'FEATURE',
        'title': 'YOLOv8 integration for vehicle detection',
        'created': 'Day 3 Morning',
        'status': 'Closed'
    },
    9: {
        'person': 1,
        'type': 'FEATURE',
        'title': 'NGSI-LD transformer with context compliance',
        'created': 'Day 4 Morning',
        'status': 'Closed'
    },
    10: {
        'person': 1,
        'type': 'BUG',
        'title': 'Pattern recognition produces inconsistent results',
        'created': 'Day 8 Morning',
        'status': 'Closed'
    },
    13: {
        'person': 1,
        'type': 'ENHANCEMENT',
        'title': 'Data quality metrics dashboard',
        'created': 'Day 10',
        'status': 'Open (Backlog)'
    },
    15: {
        'person': 1,
        'type': 'ENHANCEMENT',
        'title': 'ML-based traffic prediction',
        'created': 'Day 10',
        'status': 'Open (Backlog)'
    },
    
    # Person 2
    11: {
        'person': 2,
        'type': 'FEATURE',
        'title': 'Camera image caching with TTL',
        'created': 'Day 2 Afternoon',
        'status': 'Closed'
    },
    12: {
        'person': 2,
        'type': 'BUG',
        'title': 'Camera refresh SSL certificate error',
        'created': 'Day 8 Morning',
        'status': 'Closed'
    },
    14: {
        'person': 2,
        'type': 'FEATURE',
        'title': 'Batch entity publishing with retry logic',
        'created': 'Day 3 Afternoon',
        'status': 'Closed'
    },
    16: {
        'person': 2,
        'type': 'ENHANCEMENT',
        'title': 'GraphQL API for RDF',
        'created': 'Day 10',
        'status': 'Open (Backlog)'
    },
    17: {
        'person': 2,
        'type': 'FEATURE',
        'title': 'NGSI-LD to RDF conversion agent',
        'created': 'Day 4 Afternoon',
        'status': 'Closed'
    },
    18: {
        'person': 2,
        'type': 'ENHANCEMENT',
        'title': 'LOD 5-star rating validation',
        'created': 'Day 10',
        'status': 'Open (Backlog)'
    },
    19: {
        'person': 2,
        'type': 'FEATURE',
        'title': 'Neo4j graph database synchronization',
        'created': 'Day 5',
        'status': 'Closed'
    },
    20: {
        'person': 2,
        'type': 'ENHANCEMENT',
        'title': 'NGSI-LD temporal queries',
        'created': 'Day 10',
        'status': 'Open (Backlog)'
    },
    21: {
        'person': 2,
        'type': 'FEATURE',
        'title': 'Intelligent caching with Redis integration',
        'created': 'Day 6',
        'status': 'Closed'
    },
    30: {
        'person': 2,
        'type': 'FEATURE',
        'title': 'API Gateway with rate limiting',
        'created': 'Day 6',
        'status': 'To be implemented'
    },
    
    # Person 3
    1: {
        'person': 3,
        'type': 'CI/CD',
        'title': 'Setup automated testing with GitHub Actions',
        'created': 'Day 1 Morning',
        'status': 'Closed'
    },
    2: {
        'person': 3,
        'type': 'CI/CD',
        'title': 'Add code quality and linting workflows',
        'created': 'Day 1 Morning',
        'status': 'Closed'
    },
    3: {
        'person': 3,
        'type': 'DOCS',
        'title': 'Add contribution guidelines and PR template',
        'created': 'Day 1 Afternoon',
        'status': 'Closed'
    },
    4: {
        'person': 3,
        'type': 'SECURITY',
        'title': 'Implement security policy and dependency scanning',
        'created': 'Day 1 Afternoon',
        'status': 'Closed'
    },
    22: {
        'person': 3,
        'type': 'FEATURE',
        'title': 'Multi-channel alert dispatcher',
        'created': 'Day 5 Morning',
        'status': 'Closed'
    },
    23: {
        'person': 3,
        'type': 'BUG',
        'title': 'Webhook timeout on slow endpoints',
        'created': 'Day 8 Morning',
        'status': 'Closed'
    },
    24: {
        'person': 3,
        'type': 'ENHANCEMENT',
        'title': 'Notification analytics dashboard',
        'created': 'Day 10',
        'status': 'Open (Backlog)'
    },
    25: {
        'person': 3,
        'type': 'FEATURE',
        'title': 'Comprehensive pytest framework',
        'created': 'Day 3 Afternoon',
        'status': 'Closed'
    },
    26: {
        'person': 3,
        'type': 'BUG',
        'title': 'Test data pollution between integration tests',
        'created': 'Day 8 Afternoon',
        'status': 'Closed'
    },
    27: {
        'person': 3,
        'type': 'ENHANCEMENT',
        'title': 'Auto-scaling deployment',
        'created': 'Day 10',
        'status': 'Open (Backlog)'
    },
    28: {
        'person': 3,
        'type': 'DEPLOYMENT',
        'title': 'Docker multi-stage build optimization',
        'created': 'Day 6',
        'status': 'Closed'
    },
    29: {
        'person': 3,
        'type': 'ENHANCEMENT',
        'title': 'Blue-green deployment',
        'created': 'Day 10',
        'status': 'Open (Backlog)'
    }
}

def check_person_file(person_num):
    """Kiểm tra file PERSON_X_ISSUES_STRATEGY.md"""
    filename = f'PERSON_{person_num}_ISSUES_STRATEGY.md'
    
    # Lấy danh sách issues cần có cho person này
    expected_issues = {k: v for k, v in EXECUTION_ORDER_ISSUES.items() if v['person'] == person_num}
    
    # Đọc file hiện tại
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Tìm các issues hiện có
    found_issues = {}
    for match in re.finditer(r'#### Issue #(\d+): (\[[\w/]+\]) (.+)', content):
        issue_num = int(match.group(1))
        issue_type = match.group(2).strip('[]')
        issue_title = match.group(3)
        found_issues[issue_num] = {'type': issue_type, 'title': issue_title}
    
    print(f'\n{"="*80}')
    print(f'PERSON {person_num} - {filename}')
    print(f'{"="*80}')
    print(f'Expected issues: {sorted(expected_issues.keys())}')
    print(f'Found issues: {sorted(found_issues.keys())}')
    
    missing = []
    wrong_type = []
    wrong_title = []
    
    for num, info in expected_issues.items():
        if num not in found_issues:
            missing.append(num)
            print(f'❌ MISSING Issue #{num}: [{info["type"]}] {info["title"]}')
        else:
            found = found_issues[num]
            # Check type
            if found['type'] != info['type']:
                wrong_type.append(num)
                print(f'⚠️  Issue #{num}: TYPE SAI')
                print(f'    Expected: [{info["type"]}] {info["title"]}')
                print(f'    Found: [{found["type"]}] {found["title"]}')
            # Check title (keyword match)
            elif not any(word.lower() in found['title'].lower() for word in info['title'].split()[:3]):
                wrong_title.append(num)
                print(f'⚠️  Issue #{num}: TITLE SAI')
                print(f'    Expected: [{info["type"]}] {info["title"]}')
                print(f'    Found: [{found["type"]}] {found["title"]}')
            else:
                print(f'✅ Issue #{num}: [{info["type"]}] {info["title"]}')
    
    print(f'\n📊 Tổng kết Person {person_num}:')
    print(f'   - Thiếu hoàn toàn: {len(missing)} issues')
    print(f'   - Sai TYPE: {len(wrong_type)} issues')
    print(f'   - Sai TITLE: {len(wrong_title)} issues')
    print(f'   - Đúng: {len(expected_issues) - len(missing) - len(wrong_type) - len(wrong_title)} issues')
    
    return {
        'missing': missing,
        'wrong_type': wrong_type,
        'wrong_title': wrong_title,
        'expected': expected_issues
    }

if __name__ == '__main__':
    results = {}
    for person in [1, 2, 3]:
        results[person] = check_person_file(person)
    
    print(f'\n\n{"="*80}')
    print('TỔNG KẾT TOÀN BỘ')
    print(f'{"="*80}')
    
    total_issues = len(EXECUTION_ORDER_ISSUES)
    total_missing = sum(len(r['missing']) for r in results.values())
    total_wrong = sum(len(r['wrong_type']) + len(r['wrong_title']) for r in results.values())
    total_correct = total_issues - total_missing - total_wrong
    
    print(f'Tổng số issues trong EXECUTION_ORDER.md: {total_issues}')
    print(f'✅ Đúng hoàn toàn: {total_correct} issues ({total_correct/total_issues*100:.1f}%)')
    print(f'❌ Thiếu hoàn toàn: {total_missing} issues')
    print(f'⚠️  Sai type/title: {total_wrong} issues')
    print(f'\n🎯 Cần sửa: {total_missing + total_wrong} issues')
