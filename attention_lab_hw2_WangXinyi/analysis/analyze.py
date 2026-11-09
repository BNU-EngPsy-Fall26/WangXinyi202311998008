#!/usr/bin/env python3
"""参与者层级的离线分析备份。读取网页导出的 per-trial CSV。"""
import csv, math, statistics, sys
from collections import defaultdict

if len(sys.argv) < 2:
    print("Usage: python3 analysis/analyze.py path/to/trials.csv")
    raise SystemExit(1)

with open(sys.argv[1], encoding='utf-8-sig', newline='') as f:
    rows = list(csv.DictReader(f))

def num(v):
    try: return float(v)
    except: return float('nan')
def mean(xs):
    xs=[x for x in xs if math.isfinite(x)]
    return statistics.fmean(xs) if xs else float('nan')

by_p = defaultdict(list)
for r in rows:
    p=(r.get('participant') or '').strip()
    if p: by_p[p].append(r)

summ=[]
for p, rs in sorted(by_p.items()):
    f=[r for r in rs if 'flanker' in (r.get('experiment') or '').lower() and r.get('phase')!='practice']
    fv=[r for r in f if str(r.get('correct')) in ('1','1.0','true','True') and 150 <= num(r.get('rt_ms')) <= 3000]
    def fm(cue, cong): return mean([num(r.get('rt_ms')) for r in fv if r.get('cue_condition')==cue and r.get('congruency')==cong])
    se=fm('standard','incongruent')-fm('standard','congruent')
    he=fm('highlight','incongruent')-fm('highlight','congruent')
    g=[r for r in rs if 'graphical' in (r.get('experiment') or '').lower() and r.get('phase')!='practice']
    def ge(cond):
        vals=[]
        for r in g:
            if r.get('guide_condition')!=cond: continue
            e=num(r.get('absolute_error_pct'))
            if not math.isfinite(e): e=abs(num(r.get('response_pct'))-num(r.get('true_pct')))
            vals.append(e)
        return mean(vals)
    ne,qe=ge('none'),ge('quartile')
    summ.append((p,se,he,se-he,ne,qe,ne-qe))

print('participant,flanker_standard_effect,flanker_highlight_effect,flanker_improvement,error_no_guides,error_guides,error_improvement')
for r in summ:
    print(','.join(str(round(x,4)) if isinstance(x,float) and math.isfinite(x) else str(x) for x in r))
