# PharmaQuest data audit

Source generation timestamp: `2026-10-31 07:27`
Source records: **45,915**
Answerable records (valid answer index): **45,892**
Eligible in default practice: **45,080**
Subjects: **21**

The default count excludes any record with the configured source-quality flags and any record with an invalid answer index. It is calculated from the actual imported JSON files.

| Subject | Source records | Valid answer | Default eligible | Topics |
|---|---:|---:|---:|---:|
| Pharmacology | 11,175 | 11,174 | 11,037 | 15 |
| Pharmaceutics | 6,948 | 6,945 | 6,808 | 10 |
| Pharmacognosy | 4,319 | 4,319 | 4,271 | 11 |
| Anatomy & Physiology | 3,355 | 3,353 | 3,320 | 11 |
| Biochemistry | 3,177 | 3,177 | 3,132 | 9 |
| Physical Pharmacy | 2,065 | 2,065 | 2,023 | 7 |
| Pharmaceutical Analysis | 1,998 | 1,998 | 1,972 | 6 |
| Pharmaceutical Microbiology | 1,878 | 1,878 | 1,839 | 7 |
| Pharmaceutical Chemistry (Inorganic/Organic) | 1,658 | 1,657 | 1,615 | 6 |
| Pharmaceutical Jurisprudence | 1,635 | 1,634 | 1,542 | 4 |
| Pharmaceutical Technology / Regulatory (GMP, QA) | 1,509 | 1,509 | 1,466 | 4 |
| Other | 1,299 | 1,285 | 1,247 | 2 |
| Biopharmaceutics & Pharmacokinetics | 1,243 | 1,243 | 1,216 | 5 |
| Medicinal Chemistry | 849 | 849 | 835 | 4 |
| Toxicology | 513 | 513 | 504 | 2 |
| Drug Store & Business Management | 501 | 500 | 493 | 3 |
| Pathophysiology | 429 | 429 | 423 | 3 |
| Hospital & Clinical Pharmacy | 381 | 381 | 374 | 3 |
| Community Pharmacy / Public Health | 349 | 349 | 343 | 3 |
| Pharmacy Practice | 333 | 333 | 327 | 3 |
| Biotechnology | 301 | 301 | 293 | 3 |

## Default-excluded flags

- `answer_conflicts_poll`
- `answer_low_confidence`
- `duplicate_options`
- `image_needed`
- `incomplete_question`
- `needs_human_answer`

`answer_agrees_poll` is retained by the default filter. All original source flags remain attached to their question records. The app does not fabricate missing answers.

## Important limitation

The app preserves question wording, options, answer keys and explanations from the uploaded archive. This audit validates file structure and answer-index integrity only; it does not independently validate clinical correctness, drug information, laws or regulatory facts.