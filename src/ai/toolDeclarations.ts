// Tool schemas that Gemini can call during a live session.
// When Gemini calls one of these, the server relays it to the app as onToolCall.

export const toolDeclarations = [
  {
    name: 'highlightPart',
    description: 'Highlight a specific part in the AR view so the user can identify it physically.',
    parametersJsonSchema: {
      type: 'object' as const,
      properties: {
        partId: {
          type: 'string',
          description: 'The ID of the part to highlight (matches Part.id from the guide)',
        },
      },
      required: ['partId'],
    },
  },
  {
    name: 'nextStep',
    description: 'Advance the assembly UI to the next step.',
    parametersJsonSchema: {
      type: 'object' as const,
      properties: {
        stepIndex: {
          type: 'number',
          description: 'The index of the step to navigate to',
        },
      },
      required: ['stepIndex'],
    },
  },
  {
    name: 'markStepComplete',
    description: 'Mark an assembly step as completed in the UI checklist.',
    parametersJsonSchema: {
      type: 'object' as const,
      properties: {
        stepIndex: {
          type: 'number',
          description: 'The index of the step to mark as complete',
        },
      },
      required: ['stepIndex'],
    },
  },
];
