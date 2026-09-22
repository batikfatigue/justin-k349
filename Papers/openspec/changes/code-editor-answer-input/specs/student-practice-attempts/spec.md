# Spec Delta

## ADDED Requirements

### Requirement: Code-oriented input for code-writing parts
The system SHALL present an answerable part whose response kind is `code_writing` as a plain-text code input that supports keyboard indentation, shows line numbers, and offers a single icon-only control to open the current code in Python Tutor in a new tab, while continuing to persist and restore the answer as a single plain-text value.

#### Scenario: Student sees a code input for a code-writing part
- **WHEN** a student views a part whose response kind is `code_writing`
- **THEN** the system shows a monospace, non-spellchecked, non-autocorrected text input with a line-number gutter whose count matches the number of lines in the answer, and the input does not soft-wrap long lines

#### Scenario: Tab indents instead of moving focus
- **WHEN** a student presses Tab while the caret is inside a code-writing input
- **THEN** the system inserts four spaces at the caret (or at the start of every selected line when a multi-line selection exists) and keeps focus in the input

#### Scenario: Shift+Tab outdents
- **WHEN** a student presses Shift+Tab while the caret is inside a code-writing input
- **THEN** the system removes up to four leading spaces from the current line (or from every selected line when a multi-line selection exists) and keeps focus in the input

#### Scenario: Enter preserves indentation
- **WHEN** a student presses Enter at the end of a line inside a code-writing input
- **THEN** the new line starts with the same leading whitespace as the previous line, plus four additional spaces when the previous line ends with a colon

#### Scenario: Keyboard user can leave the code input
- **WHEN** a student presses Escape and then Tab while focus is inside a code-writing input
- **THEN** focus moves to the next focusable control without modifying the answer

#### Scenario: Code answer is saved and restored unchanged
- **WHEN** a student navigates away from or submits a question containing a code-writing part
- **THEN** the system saves exactly the text in the input, including indentation and line breaks, and shows that same text (with matching line numbers) when the student revisits the question

#### Scenario: Student opens the code in Python Tutor
- **WHEN** a student activates the icon-only "Open in Python Tutor" button in a code-writing input
- **THEN** the system opens a new browser tab at Python Tutor with the current contents of that input pre-filled in edit mode for Python 3, without submitting the form, modifying the answer, or sending the code to the application server

#### Scenario: Open button is accessible and does not submit
- **WHEN** a student views a code-writing input
- **THEN** the button has an accessible name of "Open in Python Tutor", is a non-submit button, and pressing Enter or Space on it does not save or navigate the attempt

#### Scenario: Non-code parts are unaffected
- **WHEN** a student views a part whose response kind is `short_text`, `structured_response`, or `flowchart_interpretation`
- **THEN** the system shows the existing plain multi-line text input without a line-number gutter, Tab/Enter indentation handling, or an "Open in Python Tutor" button
