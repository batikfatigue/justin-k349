---
tags:
  - software-engineering
  - software-development-process
  - computing
status: learning
---
# Software Engineering

![[software-development-process-introduction.mp4]]

> [!abstract] Topic Map
> 1. [[#1. Gather Requirements|Gather Requirements]]
> 2. [[#2. Design Solutions|Design Solutions]]
> 3. [[#3. Write Code|Write Code]]
> 4. [[#4. Test and Refine Code|Test and Refine Code]]
> 5. [[#5. Deploy Code|Deploy Code]]
> 6. [[#Five Stages of Software Development|Five Stages of Software Development]]

---

## 1. Gather Requirements

**Goal**

- Determine the nature of the problem.
- Identify why a program is needed.
- Understand what the program is expected to do.

> [!example]- Some Tasks That Can Be Done
> - **Interview the intended audience** to understand the nature of the problem or their expectations.
> - **Specify the inputs** needed for the problem and how the inputs can be supplied to the program.
> - **Specify the outputs** needed for the problem and the format of the output.

> [!question]- Practice: Attendance Software Requirements
> What are some of the requirements that Rajesh and Grace have identified for their attendance taking software?
>
> - [x] Mark attendance
> - [x] Track absentees
> - [ ] Tracks late coming
> - [x] Support 1200 users
> - [x] Work on multiple operating systems
> - [ ] Track students' movement in school

> [!question]- Practice: Inputs and Outputs
> Fill in the blanks with the input and output that Rajesh and Grace have identified for their attendance taking software.
>
> | Type | Answer |
> |---|---|
> | Input | All the student's *fingerprints* |
> | Output | An attendance *report* |

---

## 2. Design Solutions

**Goal**

- Consider the options available before any code is written.
- Choose an algorithm based on the resources available, such as manpower and time.

> [!example]- Some Tasks That Can Be Done
> - Manually **solve different simplified examples** of the problem and **generalise the steps** needed to produce the required output.
> - Try different ways to **break down the problem** into smaller parts such that the intended output of each part gets closer to what is needed to solve the problem.
> - Compare the problem, or its smaller parts, to other problems that have been solved before and **identify suitable algorithms** that can be used.
> - **Estimate** the amount of **effort** needed to write the code or the **time needed** to complete the algorithm before making a definite choice.
> - **Write** possible algorithms using either **flowcharts or pseudo-code**.

> [!question]- Practice: Designing Solutions
> Which of the following is/are step(s) to take when designing solutions?
>
> You may select more than 1 option.
>
> - [ ] Start writing significant amounts of code
> - [ ] Estimate the timeline of the project and its delivery date
> - [x] Decide on the general layout and colour scheme of the software interface
> - [x] Recognise patterns in steps and generalise the algorithmic solutions where possible

---

## 3. Write Code

**Goal**

- Write code that performs the algorithm as planned in the previous stage as efficiently as possible.

In traditional program development, the code for the final program is not actually written until the first two stages of gathering requirements and planning solutions have been completed. This minimises the possibility of producing code based on incomplete requirements or inefficient algorithms that would eventually need to be discarded.

> [!info]- Did You Know?
> There are other approaches to program development that do not have five distinct stages.
>
> For instance, in **agile** software development, code may be continuously written and refined while the gathering of requirements is still taking place.

> [!question]- Practice: Why Code After Planning?
> Explain why Rajesh and Grace only start to write code for the final program after they have gathered requirements thoroughly, planned in detail, and sought approval from Mr Imran.
>
> > [!success]- Suggested Answer
> > Rajesh and Grace only start writing code after gathering requirements, planning the solution, and getting approval because this helps ensure that the program will meet the users' needs. It also reduces the chance of producing code based on **incomplete requirements** or **inefficient algorithms**. By planning first, they are less likely to waste time writing code that later needs to be **changed or discarded**. Once Mr Imran approves the plan, they can write code that follows the planned algorithm as efficiently as possible.

---

## 4. Test and Refine Code

**Goal**

- Uncover and rectify problems and imperfections with the code.
- Ensure that the program works as intended.

After the initial code is written, the resulting program is likely to require further refinement.

Some possible reasons include:

- The programmer may have made **mistakes in translating the planned algorithm into code** or may have **forgotten to consider exceptional cases** where the input would need to be treated specially.

For example, the programmer may have made a syntax error or forgotten to check for invalid input. These are relatively minor errors that usually would not require a major rewriting of code as simply correcting the syntax error or adding an if statement would usually be sufficient to correct the program.

- The solution-planning stage may not have been performed properly, resulting in an **unsuitable or incomplete algorithm**.

Depending on how serious the mismatch is, it may be possible to keep most of the written code and simply make refinements. Otherwise, it may be necessary to discard the written code and redo the evaluation of algorithms.

- The **requirement-gathering** stage may have been **incomplete**, resulting in code that does not actually solve the problem. Depending on how serious the mismatch is, it may or may not be possible to reuse most of the written code.

**Testing** is the process by which these and other imperfections are uncovered.

This is done by running the code through one or more test cases to evaluate whether the written code adequately satisfies the gathered requirements and is ready to be used.

A **test case** usually consists of a set of inputs and the corresponding set of expected outputs. By feeding these inputs into a program and comparing its actual output with the expected output, we can evaluate whether the program is working as intended.

The effectiveness of testing depends entirely on how comprehensive and well-designed the test cases are. To learn more, you may visit the lesson on [[Designing Test Cases]].

> [!info]- Did You Know?
> Testing is so important in making sure code is written correctly that, instead of five distinct stages, some programmers use an alternative approach to program development - test cases are written first and code is written incrementally to pass each test. This alternative process is known as Test-Driven Development (TDD).

---

## 5. Deploy Code

**Goal**

- Program is "rolled out" and used by its intended audience.

> [!example]- Some Tasks That Can Be Performed
> - **Training users** to use the program.
> - **Transitioning from** an **old** program or system to the **new program**.
> - **Evaluating the effectiveness of the program** in solving the problem and considering any changes that might increase its usability or effectiveness.

---

## Five Stages of Software Development

> [!question]- Practice: Fill in the Five Stages
> Fill in the blanks to complete the 5 stages of software development.
>
> - Gather **Requirements**
> - Design **Solutions**
> - Write **Code**
> - **Test** and **Refine** Code
> - **Deploy** Code

> [!question]- Practice: Going Through the 5 Stages More Than Once
> What could be some reasons for going through the 5 stages of software development more than once?
>
> You may select more than 1 option.
>
> - [ ] The additional time required to go through the 5 stages more than once is not significant.
> - [x] New and unexpected requirements may arise after deployment.
> - [x] End-users may not truly know what they want until they have tried the product.
> - [x] Going through the 5 stages only once would involve high risk and uncertainty as no working software is developed until the later stages.

> [!question]- Practice: Problems Identified After Review
> State two problems that Rajesh and Grace have identified with their attendance taking software.
>
> 1. Students cannot scan their fingerprints after swimming lessons.
> 2. Students cannot use the scanner if the finger being scanned is covered, such as by a bandage due to a cut.

> [!question]- Practice: New Requirements After Review
> State two new requirements which Rajesh and Grace believe they should work on after their review.
>
> 1. Add a manual override function.
> 2. Collect multiple fingerprint samples so each student can use more than one finger.

> [!question]- Practice: Cyclical Development Process
> Why would developers prefer to go through a cyclical software development process as opposed to a linear one?
>
> You may select more than 1 option.
>
> - [x] It facilitates continuous review and refinement.
> - [x] End-users get to test and use functional prototypes in their daily operations.
> - [x] It allows developers to focus on implementing bite-sized requirements each cycle.
