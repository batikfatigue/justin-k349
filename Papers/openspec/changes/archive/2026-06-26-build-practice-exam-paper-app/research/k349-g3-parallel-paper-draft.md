# K349 G3 Computing Parallel Practice Paper Draft

This draft is based only on the visible photographed example paper. It is not a verbatim transcription. It preserves the same assessment outcomes, question styles, mark spread, and expected answer targets using different wording and contexts.

Assumption: page 1 of the source paper is a cover/instructions page because the visible content begins with Question 1 on page 2.

## Source Pattern Observed

- Total visible assessment shape: 5 questions, about 30 marks.
- Question styles:
  - Single-choice checkbox.
  - Short explanation with 2 marking points.
  - Short factual recall.
  - Identify invalid Python variable names with reasons.
  - Explain a Python algorithm and identify a bug.
  - State Boolean/output results for Python code snippets.
  - Identify line number of Python errors and correct them.
  - Interpret a flowchart construct.
  - Write Python code from a flowchart.
- Required import support discovered:
  - Nested question parts and subparts.
  - Code blocks with preserved indentation.
  - Tables with program and expected-output columns.
  - Single-choice answers.
  - Short text answers with accepted alternatives.
  - Open-ended rubrics with partial marking points.
  - Error-correction answers requiring both line number and corrected line.
  - Flowchart stimuli, ideally as structured nodes/edges rather than images only.

## Parallel Paper: Student Version

### Question 1: Iterative Software Development [4]

The stages in software development may be carried out in a linear way or repeated in cycles. One example of an iterative approach is agile development.

#### 1(a) [1]

Tick all applicable box to identify the stages included in the simplified sprint cycle taught for this paper.

- [ ] deploy code
- [ ] feedback and review
- [ ] design solutions
- [ ] test & refine code
- [ ] consolidate requirements

#### 1(b) [4]

A school is developing a new online homework system for students. The first version only needs students to log in, view homework, and submit answers. However, after teachers try the first version, they request extra features such as automatic marking, late-submission warnings, and progress reports.

The development team decides to use agile sprint cycles instead of completing the whole system in one long project.

Question:
Explain how using sprint cycles helps the software engineers stay flexible when developing this homework system, especially when teachers request changes during the project. [4 marks]

Answer:

........................................................................

........................................................................

........................................................................

........................................................................

#### 1(c) [1]

State one other iterative software development methodology.

Answer:

........................................................................

### Question 2: Python Variables And Algorithms [8]

#### 2(a) [2]

The following Python variable names are suggested for a program.

```
team_score       Movie12       total.marks
breakfast        2026grade
```

Identify two invalid Python variable names and explain why each is invalid.

Invalid variable name:

........................................................................

Explanation:

........................................................................

Invalid variable name:

........................................................................

Explanation:

........................................................................

#### 2(b) [6]

A school event organiser writes a program to generate a random 5-letter prize code. Each prize code should contain 5 unique uppercase letters.

The algorithm of the program is shown below.

```python
import random

prize_code = ""

for count in range(5):
    number = random.randint(65, 90)
    letter = chr(number)

    if letter not in prize_code:
        prize_code = prize_code + letter

print(prize_code)
```

Describe in detail how this program is executed and identify one bug in the program.

Answer:

........................................................................

........................................................................

........................................................................

........................................................................

........................................................................

........................................................................

### Question 3: Python Output [10]

#### 3(a) [2]

State the Boolean output for each program. Each program is independent.

| Part | Program                                                                                          | Expected output |
| ---- | ------------------------------------------------------------------------------------------------ | --------------- |
| (i)  | `s1 = "computing "`<br>`s2 = "G3Computing"`<br>`print(s1 in s2)`                                 |                 |
| (ii) | `id_code = "123456"`<br>`is_valid = len(id_code) == 7 or id_code.isdigit()`<br>`print(is_valid)` |                 |

#### 3(b) [8]

State the expected output for each program. Each program is independent.

| Part   | Program                                                            | Expected output |
| ------ | ------------------------------------------------------------------ | --------------- |
| (i)    | `x = 5`<br>`x = x + 3`<br>`print(x)`                               |                 |
| (ii)   | `x = -26 // 5 % 4`<br>`print(x)`                                   |                 |
| (iii)  | `num_str = "10"`<br>`result = int(num_str) * 2`<br>`print(result)` |                 |
| (iv)   | `num = 10`<br>`num = 5`<br>`num += 2`<br>`print(num)`              |                 |
| (v)    | `text = "Programming"`<br>`print(text[3:7])`                       |                 |
| (vi)   | `word = "Learning"`<br>`print(word[7:1:-2])`                       |                 |
| (vii)  | `text = "A B C 1 2 3"`<br>`print(len(text))`                       |                 |
| (viii) | `result = pow(2.0, 2)`<br>`print(result)`                          |                 |

### Question 4: Correcting Program Errors [2]

Identify the line number of each error and write the corrected line for each.

#### 4(a) [1]

| Line | Program                              |
| ---- | ------------------------------------ |
| 01   | `message = 'You're leaving already?` |
| 02   | `print(message)`                     |

Expected output:

```text
You're leaving already?
```

Line number:

........................................................................

Correction:

........................................................................

#### 4(b) [1]

| Line | Program         |
| ---- | --------------- |
| 01   | `x = 1`         |
| 02   | `while x <= 4:` |
| 03   | `    x = x + 1` |
| 04   | `print(x)`      |
| 05   | `print(x)`      |

Expected output:

```text
2
3
4
5
5
```

Line number:

........................................................................

Correction:

........................................................................

### Question 5: Team Qualification Algorithm [6]

A sports organiser writes a simple program, using a flowchart, to decide whether a team qualifies for the final round of a competition.

Flowchart:

```text
START
  |
INPUT final rank (rank)
  |
rank less than or equal to 3?
  | yes                         | no
OUTPUT "Promoted to the finals." OUTPUT "Not promoted."
  \_____________________________/
                 |
          OUTPUT "End"
                 |
                STOP
```

#### 5(a) [1]

State the programming construct shown by the decision in the flowchart.

Answer:

........................................................................

#### 5(b) [5]

Write Python program code based on the flowchart.

Answer:

```python

```

### Question 6: Countdown Algorithm [6]

A teacher writes a simple program, using a flowchart, to count down from a starting number.

Flowchart:

```text
START
  |
INPUT starting number (count)
  |
  +-----------------------------+
  |                             |
  v                             |
count greater than 0?           |
  | yes                         | no
  v                             v
OUTPUT count              OUTPUT "Done"
  |                             |
count = count - 1              STOP
  |
  +-----------------------------+
```

#### 6(a) [1]

State the programming construct shown by the repeated flow in the flowchart.

Answer:

........................................................................

#### 6(b) [5]

Write Python program code based on the flowchart.

Answer:

```python

```

## Mark Scheme / Target Answers

### Question 1

1(a): Correct boxes:

- `deploy code`
- `consolidate requirements`
- `design solutions`
- `test & refine code`

1(b): Award 1 mark each, max 4:

- The project is broken into smaller parts, so the team does not need to build the whole system at once.
- Each sprint focuses on a selected set of requirements or features.
- At the end of each sprint, a working version can be shown to users for feedback.
- New or changed requirements can be added, removed, or reprioritised before the next sprint.
- Testing and refinement happen repeatedly, so problems are found earlier.
- This makes it easier to adapt to changing needs without restarting the whole project.

1(c): `test-driven development` or another valid iterative methodology accepted by tutor.

### Question 2

2(a): Award 1 mark for each invalid name plus valid reason, max 2:

- `total.marks`: invalid because it contains a full stop. Python variable names can only contain letters, numbers, and underscores.
- `2026grade`: invalid because it starts with a number. Python variable names cannot start with a digit.

2(b): Award up to 6 marks:

- Imports the `random` module.
- Initialises `prize_code` as an empty string.
- Repeats the process five times using a `for` loop.
- Generates a random integer from 65 to 90.
- Converts the integer to its corresponding uppercase letter using `chr()`.
- Checks that the generated letter is not already in `prize_code`.
- Appends the letter to the end of `prize_code` if it is unique.
- Prints the final `prize_code`.
- Bug: the final prize code may contain fewer than five letters if a duplicate letter is generated, because the duplicate is skipped but the loop still moves on.

### Question 3

3(a):

- (i) `False`
- (ii) `True`

3(b):

- (i) `8`
- (ii) `2`
- (iii) `20`
- (iv) `7`
- (v) `gram`
- (vi) `gir`
- (vii) `11`
- (viii) `4.0`

### Question 4

4(a):

- 1 mark: line number `01`
- 1 mark: correction `message = "You're leaving already?"`
- Alternative accepted: `message = 'You\\'re leaving already?'`

4(b):

- AI marking model answer: line number `04`; corrected line `    print(x)`.
- 1 mark: identifies line `04`.
- 1 mark: corrected line is indented one level so line 4 starts in the same column as line 3.

### Question 5

5(a): `selection`

5(b): Award up to 5 marks:

```python
rank = int(input("Final rank: "))

if rank <= 3:
    print("Promoted to the finals.")
else:
    print("Not promoted.")

print("End")
```

Possible mark split:

- Gets integer input for final rank/position.
- Uses `if rank <= 3`.
- Correct promoted output in the true branch.
- Correct not-promoted output in the false branch.
- Prints `End` after the selection.

### Question 6

6(a): `iteration`

Accepted alternatives: `repetition`, `loop`, or `looping`.

6(b): Award up to 5 marks:

```python
count = int(input("Starting number: "))

while count > 0:
    print(count)
    count = count - 1

print("Done")
```

Possible mark split:

- Gets integer input for the starting number/count.
- Uses a loop with the condition `count > 0`.
- Prints `count` inside the loop.
- Decreases `count` by 1 inside the loop.
- Prints `Done` after the loop ends.

## Import Requirement Notes Discovered From This Paper

The JSON import cannot be limited to basic MCQ and free-response. This paper needs a richer but still controlled question model.

### Needed question-level fields

- `id`
- `number`
- `title`
- `marks`
- `parts`
- `stimulus`
- `answer`
- `rubric`
- `gradingMode`
- `studentFeedbackPolicy`

### Needed part types

- `single_choice`
- `short_text`
- `structured_response`
- `code_output_table`
- `error_correction`
- `flowchart_interpretation`
- `code_writing`

### Needed stimulus types

- `text`
- `code`
- `table`
- `flowchart`
- `expected_output`

### Needed marking features

- Exact answer matching for outputs like `False`, `True`, `8`, `gram`, and `nna`.
- Case-sensitive or case-insensitive matching per answer.
- Accepted alternatives for short answers, such as `selection`, `if-else`, `iteration`, `repetition`, and `loop`.
- Rubric-point marking for explanation/code-writing questions.
- Hidden answers and rubrics for student-facing views.
- Multi-part marks that roll up into parent question marks.
- Tutor-visible rationale separate from student-visible feedback.

### Needed flowchart representation

Flowcharts should be importable as structured data, not only as an image, so the app can render them consistently.

Minimum suggested structure:

```json
{
  "type": "flowchart",
  "nodes": [
    { "id": "start", "kind": "terminal", "text": "START" },
    { "id": "input", "kind": "input", "text": "INPUT final rank (rank)" },
    {
      "id": "decision",
      "kind": "decision",
      "text": "rank less than or equal to 3?"
    },
    {
      "id": "yes_output",
      "kind": "output",
      "text": "OUTPUT \"Promoted to the finals.\""
    },
    { "id": "no_output", "kind": "output", "text": "OUTPUT \"Not promoted.\"" },
    { "id": "end_output", "kind": "output", "text": "OUTPUT \"End\"" },
    { "id": "stop", "kind": "terminal", "text": "STOP" }
  ],
  "edges": [
    { "from": "start", "to": "input" },
    { "from": "input", "to": "decision" },
    { "from": "decision", "to": "yes_output", "label": "yes" },
    { "from": "decision", "to": "no_output", "label": "no" },
    { "from": "yes_output", "to": "end_output" },
    { "from": "no_output", "to": "end_output" },
    { "from": "end_output", "to": "stop" }
  ]
}
```

### Needed variant/parallel-question support

Since this app may hold multiple parallel versions that target the same outcome, JSON should support:

- `outcomeId`: common learning outcome being assessed.
- `variantGroupId`: links parallel variants.
- `targetAnswerId`: points to the shared answer/rubric where appropriate.
- `difficulty`: optional tutor label.

Example:

```json
{
  "id": "q3b-v-string-slice",
  "outcomeId": "python-string-slicing",
  "variantGroupId": "q3b-v",
  "targetAnswerId": "answer-gram",
  "type": "code_output",
  "marks": 1
}
```
