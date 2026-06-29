import type { ImportedPaper } from "@/lib/domain";

export const k349Paper: ImportedPaper = {
  schemaVersion: "1.0",
  paperId: "k349-g3-computing-practice-1",
  title: "K349 G3 Computing Practice Paper 1",
  syllabus: "K349 G3 Computing",
  mode: "practice",
  status: "published",
  totalMarks: 32,
  accessCodes: [{ code: "G3K349", label: "G3 Computing" }],
  questions: [
    {
      id: "q1",
      number: "1",
      title: "Iterative Software Development",
      marks: 4,
      outcomeId: "software-development",
      variantGroupId: "iterative-methods",
      targetAnswerId: "iterative-sprints",
      difficulty: "standard",
      parts: [
        {
          id: "q1a",
          label: "1(a)",
          type: "single_choice",
          prompt: "Tick one box to identify the stage not included in the simplified sprint cycle.",
          marks: 1,
          response: {
            kind: "single_choice",
            options: [
              { value: "collect_requirements", label: "collect requirements" },
              { value: "write_code", label: "write program code" },
              { value: "test_solution", label: "test the solution" },
              { value: "review", label: "review" }
            ]
          },
          marking: { mode: "exact", acceptedAnswers: ["review"], caseSensitive: false }
        },
        {
          id: "q1b",
          label: "1(b)",
          type: "structured_response",
          prompt: "Explain how short sprint cycles help when a requirement changes.",
          marks: 2,
          response: { kind: "structured_response", lines: 4 },
          marking: {
            mode: "rubric_ai",
            maxScore: 2,
            modelAnswer:
              "Short iterations let teams incorporate changed requirements and feedback in the next sprint.",
            rubricPoints: [
              { text: "Mentions short repeated stages or iterations.", marks: 1 },
              { text: "Explains that changes or feedback can be handled in a later sprint.", marks: 1 }
            ]
          }
        },
        {
          id: "q1c",
          label: "1(c)",
          type: "short_text",
          prompt: "State one other iterative software development methodology.",
          marks: 1,
          response: { kind: "short_text", lines: 1 },
          marking: {
            mode: "exact",
            acceptedAnswers: ["test-driven development", "scrum"],
            caseSensitive: false
          }
        }
      ]
    },
    {
      id: "q2",
      number: "2",
      title: "Python Variables And Algorithms",
      marks: 8,
      parts: [
        {
          id: "q2a",
          label: "2(a)",
          type: "structured_response",
          prompt: "Identify two invalid Python variable names and explain why each is invalid.",
          marks: 2,
          stimulus: [
            {
              type: "table",
              columns: ["Suggested names"],
              rows: [["team_score"], ["Movie12"], ["final-answer"], ["breakfast"], ["#points_awarded"]]
            }
          ],
          response: { kind: "structured_response", lines: 4 },
          marking: {
            mode: "rubric_ai",
            maxScore: 2,
            modelAnswer:
              "final-answer is invalid because hyphen is subtraction. #points_awarded is invalid because # begins a comment.",
            rubricPoints: [
              { text: "Identifies final-answer and explains the hyphen.", marks: 1 },
              { text: "Identifies #points_awarded and explains the hash symbol.", marks: 1 }
            ]
          }
        },
        {
          id: "q2b",
          label: "2(b)",
          type: "structured_response",
          prompt: "Describe how the password program executes and identify one bug.",
          marks: 6,
          stimulus: [
            {
              type: "code",
              language: "python",
              title: "Password generator",
              code: "import random\n\ntemporary_password = \"\"\n\nfor count in range(6):\n    number = random.randint(33, 126)\n    password_char = chr(number)\n    if password_char not in temporary_password:\n        temporary_password = temporary_password + password_char\n\nprint(temporary_password)"
            }
          ],
          response: { kind: "structured_response", lines: 8 },
          marking: {
            mode: "rubric_ai",
            maxScore: 6,
            modelAnswer:
              "The program imports random, builds an empty password, loops six times, converts random integers to characters, appends unique characters, prints the password, and may produce fewer than six characters if duplicates are skipped.",
            rubricPoints: [
              { text: "Explains random import and empty string setup.", marks: 1 },
              { text: "Explains the six-iteration loop.", marks: 1 },
              { text: "Explains random integer and chr conversion.", marks: 1 },
              { text: "Explains the uniqueness check.", marks: 1 },
              { text: "Explains appending and printing.", marks: 1 },
              { text: "Identifies the skipped-duplicate length bug.", marks: 1 }
            ]
          }
        }
      ]
    },
    {
      id: "q3",
      number: "3",
      title: "Python Output",
      marks: 10,
      parts: [
        {
          id: "q3a",
          label: "3(a)",
          type: "code_output_table",
          prompt: "State the Boolean output for each program.",
          marks: 2,
          stimulus: [
            {
              type: "table",
              columns: ["Part", "Program"],
              rows: [
                ["(i)", "s1 = \"data\"\ns2 = \"Database\"\nprint(s1 in s2)"],
                ["(ii)", "id_code = \"123456\"\nis_valid = len(id_code) == 6 and id_code.isdigit()\nprint(is_valid)"]
              ]
            }
          ],
          response: {
            kind: "code_output_table",
            rows: [
              { id: "i", label: "(i)" },
              { id: "ii", label: "(ii)" }
            ]
          },
          marking: {
            mode: "code_output_table",
            rows: [
              { id: "i", expectedOutput: "False", marks: 1 },
              { id: "ii", expectedOutput: "True", marks: 1 }
            ],
            caseSensitive: true
          }
        },
        {
          id: "q3b",
          label: "3(b)",
          type: "code_output_table",
          prompt: "State the expected output for each program.",
          marks: 8,
          response: {
            kind: "code_output_table",
            rows: [
              { id: "i", label: "(i)" },
              { id: "ii", label: "(ii)" },
              { id: "iii", label: "(iii)" },
              { id: "iv", label: "(iv)" },
              { id: "v", label: "(v)" },
              { id: "vi", label: "(vi)" },
              { id: "vii", label: "(vii)" },
              { id: "viii", label: "(viii)" }
            ]
          },
          marking: {
            mode: "code_output_table",
            rows: [
              { id: "i", expectedOutput: "8", marks: 1 },
              { id: "ii", expectedOutput: "2", marks: 1 },
              { id: "iii", expectedOutput: "20", marks: 1 },
              { id: "iv", expectedOutput: "7", marks: 1 },
              { id: "v", expectedOutput: "gram", marks: 1 },
              { id: "vi", expectedOutput: "nna", marks: 1 },
              { id: "vii", expectedOutput: "7", marks: 1 },
              { id: "viii", expectedOutput: "8.0", marks: 1 }
            ],
            caseSensitive: true
          }
        }
      ]
    },
    {
      id: "q4",
      number: "4",
      title: "Correcting Program Errors",
      marks: 4,
      parts: [
        {
          id: "q4a",
          label: "4(a)",
          type: "error_correction",
          prompt: "Identify the line number and write the corrected line.",
          marks: 2,
          stimulus: [
            { type: "code", language: "python", code: "01 message = 'It's time to go!'\n02 print(message)" },
            { type: "expected_output", output: "It's time to go!" }
          ],
          response: { kind: "error_correction" },
          marking: {
            mode: "error_correction",
            expectedLineNumber: "01",
            acceptedCorrectedLines: ["message = \"It's time to go!\"", "message = 'It\\'s time to go!'"],
            lineNumberMarks: 1,
            correctionMarks: 1
          }
        },
        {
          id: "q4b",
          label: "4(b)",
          type: "error_correction",
          prompt: "Identify the line number and write the corrected line.",
          marks: 2,
          stimulus: [
            { type: "code", language: "python", code: "01 x = 1\n02 while x <= 4:\n03     x = x + 1\n04 print(x)\n05 print(x)" },
            { type: "expected_output", output: "2\n3\n4\n5\n5" }
          ],
          response: { kind: "error_correction" },
          marking: {
            mode: "rubric_ai",
            modelAnswer:
              "Line number: 04\nCorrected line: `    print(x)`\nThe corrected line must be indented one level so line 04 starts in the same column as line 03.",
            rubricPoints: [
              {
                id: "line-04",
                text: "Award 1 mark for identifying line 04 as the line containing the error.",
                marks: 1
              },
              {
                id: "indented-print-correction",
                text: "Award 1 mark for correcting line 04 to an indented print(x) aligned with line 03. Accept either four spaces or one tab for the indentation. Do not award this mark for unindented print(x).",
                marks: 1
              }
            ],
            maxScore: 2
          }
        }
      ]
    },
    {
      id: "q5",
      number: "5",
      title: "Team Qualification Algorithm",
      marks: 6,
      stimulus: [
        {
          type: "flowchart",
          nodes: [
            { id: "start", kind: "terminal", text: "START" },
            { id: "input", kind: "input", text: "INPUT final rank (rank)" },
            { id: "decision", kind: "decision", text: "rank <= 3?" },
            { id: "yes_output", kind: "output", text: "OUTPUT Promoted to the finals." },
            { id: "no_output", kind: "output", text: "OUTPUT Not promoted." },
            { id: "end_output", kind: "output", text: "OUTPUT End" },
            { id: "stop", kind: "terminal", text: "STOP" }
          ],
          edges: [
            { from: "start", to: "input" },
            { from: "input", to: "decision" },
            { from: "decision", to: "yes_output", label: "yes" },
            { from: "decision", to: "no_output", label: "no" },
            { from: "yes_output", to: "end_output" },
            { from: "no_output", to: "end_output" },
            { from: "end_output", to: "stop" }
          ]
        }
      ],
      parts: [
        {
          id: "q5a",
          label: "5(a)",
          type: "flowchart_interpretation",
          prompt: "State the programming construct shown by the decision.",
          marks: 1,
          response: { kind: "flowchart_interpretation", lines: 1 },
          marking: { mode: "exact", acceptedAnswers: ["selection", "if-else"], caseSensitive: false }
        },
        {
          id: "q5b",
          label: "5(b)",
          type: "code_writing",
          prompt: "Write Python program code based on the flowchart.",
          marks: 5,
          response: { kind: "code_writing", language: "python", lines: 8 },
          marking: {
            mode: "rubric_ai",
            maxScore: 5,
            modelAnswer:
              "rank = int(input('Final rank: '))\nif rank <= 3:\n    print('Promoted to the finals.')\nelse:\n    print('Not promoted.')\nprint('End')",
            rubricPoints: [
              { text: "Gets integer input for rank.", marks: 1 },
              { text: "Uses if rank <= 3.", marks: 1 },
              { text: "Outputs promoted text in true branch.", marks: 1 },
              { text: "Outputs not-promoted text in false branch.", marks: 1 },
              { text: "Prints End after the selection.", marks: 1 }
            ]
          }
        }
      ]
    }
  ]
};
