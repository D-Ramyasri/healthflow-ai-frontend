from pathlib import Path
p=Path(r"d:\HHP\healthflow-ai-main\healthflow-ai-main\frontend\src\pages\doctor\DoctorDashboard.tsx")
s=p.read_text(encoding='utf-8')
paren_stack=[]
brace_stack=[]
issues=[]
for i,line in enumerate(s.splitlines(),1):
    for ch_idx,ch in enumerate(line,1):
        if ch=='(':
            paren_stack.append((i,ch_idx,line))
        elif ch==')':
            if paren_stack:
                paren_stack.pop()
            else:
                issues.append((i,'extra_close_paren',line.strip()))
        elif ch=='{':
            brace_stack.append((i,ch_idx,line))
        elif ch=='}':
            if brace_stack:
                brace_stack.pop()
            else:
                issues.append((i,'extra_close_brace',line.strip()))

print('Unmatched opening parentheses count:', len(paren_stack))
print('Unmatched opening braces count:', len(brace_stack))
if issues:
    print('\nFound unexpected closing tokens:')
    for it in issues:
        print(it)

if paren_stack:
    print('\nRemaining unmatched "(" occurrences (line, col, snippet):')
    for ln,col,txt in paren_stack[-20:]:
        print(ln,col,txt.strip())

if brace_stack:
    print('\nRemaining unmatched "{" occurrences (line, col, snippet):')
    for ln,col,txt in brace_stack[-20:]:
        print(ln,col,txt.strip())
