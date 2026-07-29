import {
  DECISION_QUESTIONS,
  resolveDecisionOutcome,
  selectRandomDecision,
  warnForInvalidDecisionChances,
} from './decisionQuestions';

describe('decision questions', () => {
  test('defines twelve bilingual decisions with three valid choices each', () => {
    expect(DECISION_QUESTIONS).toHaveLength(12);

    DECISION_QUESTIONS.forEach((decision) => {
      expect(decision.id).toBeTruthy();
      expect(decision.question.en).toBeTruthy();
      expect(decision.question.jp).toBeTruthy();
      expect(decision.choices).toHaveLength(3);

      decision.choices.forEach((decisionChoice) => {
        expect(decisionChoice.text.en).toBeTruthy();
        expect(decisionChoice.text.jp).toBeTruthy();
        expect(
          decisionChoice.chances.good +
            decisionChoice.chances.neutral +
            decisionChoice.chances.bad
        ).toBe(100);

        ['good', 'neutral', 'bad'].forEach((outcomeType) => {
          const decisionOutcome = decisionChoice.outcomes[outcomeType];

          expect(decisionOutcome.effect.type).toBeTruthy();
          expect(decisionOutcome.resultId).toBeTruthy();
          expect(decisionOutcome.result.en).toBeTruthy();
          expect(decisionOutcome.result.jp).toBeTruthy();
          expect(decisionOutcome.text.en).toBeTruthy();
          expect(decisionOutcome.text.jp).toBeTruthy();
        });
      });
    });
  });

  test('maps every result to the required explicit effect', () => {
    const effectsByResultId = DECISION_QUESTIONS.flatMap(({ choices }) =>
      choices.flatMap(({ outcomes }) => Object.values(outcomes))
    ).reduce(
      (effects, { effect, resultId }) => ({ ...effects, [resultId]: effect }),
      {}
    );

    expect(effectsByResultId).toMatchObject({
      cauldronPotion: { potionId: 'cauldron', type: 'gainPotion' },
      commonPotion: { rarity: 'Common', type: 'gainPotion' },
      commonToken: { rarity: 'Common', type: 'gainToken' },
      firstAidPotion: { potionId: 'first-aid', type: 'gainPotion' },
      freezePotion: { potionId: 'ice-beam', type: 'gainPotion' },
      lose10Health: { amount: 10, type: 'loseHealth' },
      lose15Health: { amount: 15, type: 'loseHealth' },
      lose20Health: { amount: 20, type: 'loseHealth' },
      lose5Health: { amount: 5, type: 'loseHealth' },
      losePotion: { type: 'losePotion' },
      loseToken: { type: 'loseToken' },
      loseTurn: { type: 'skipNextTurn' },
      nothing: { type: 'none' },
      rarePotion: { rarity: 'Rare', type: 'gainPotion' },
      rareToken: { rarity: 'Rare', type: 'gainToken' },
      smallHealPotion: { potionId: 'small-heal', type: 'gainPotion' },
      thawPotion: { potionId: 'thaw', type: 'gainPotion' },
      token: { rarity: 'Any', type: 'gainToken' },
    });
  });

  test('selects decisions across the full random range', () => {
    expect(selectRandomDecision(DECISION_QUESTIONS, () => 0)).toBe(
      DECISION_QUESTIONS[0]
    );
    expect(selectRandomDecision(DECISION_QUESTIONS, () => 0.999999)).toBe(
      DECISION_QUESTIONS[11]
    );
    expect(selectRandomDecision([], () => 0)).toBeNull();
  });

  test('resolves good, neutral, and bad outcomes at weighted boundaries', () => {
    const decisionChoice = DECISION_QUESTIONS[0].choices[0];

    expect(resolveDecisionOutcome(decisionChoice, () => 0.4999).type).toBe('good');
    expect(resolveDecisionOutcome(decisionChoice, () => 0.5).type).toBe('neutral');
    expect(resolveDecisionOutcome(decisionChoice, () => 0.6999).type).toBe(
      'neutral'
    );
    expect(resolveDecisionOutcome(decisionChoice, () => 0.7).type).toBe('bad');
  });

  test('never selects a zero-chance neutral outcome', () => {
    const decisionChoice = DECISION_QUESTIONS[11].choices[0];

    expect(decisionChoice.chances.neutral).toBe(0);
    expect(resolveDecisionOutcome(decisionChoice, () => 0.6999).type).toBe('good');
    expect(resolveDecisionOutcome(decisionChoice, () => 0.7).type).toBe('bad');
  });

  test('proportionally removes bad outcomes while Good Decisions is active', () => {
    const decisionChoice = DECISION_QUESTIONS[0].choices[0];
    const options = { preventBadOutcome: true };

    expect(resolveDecisionOutcome(decisionChoice, () => 0.7142, options).type).toBe(
      'good'
    );
    expect(resolveDecisionOutcome(decisionChoice, () => 0.7143, options).type).toBe(
      'neutral'
    );
    expect(resolveDecisionOutcome(decisionChoice, () => 0.9999, options).type).toBe(
      'neutral'
    );
  });

  test('selects good instead of a zero-chance N/A neutral outcome', () => {
    const decisionChoice = DECISION_QUESTIONS[11].choices[0];
    const outcome = resolveDecisionOutcome(decisionChoice, () => 0.9999, {
      preventBadOutcome: true,
    });

    expect(outcome.type).toBe('good');
    expect(outcome.result.en).not.toBe('N/A');
  });

  test('warns and defaults to good when no safe outcome chance exists', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const decisionChoice = {
      chances: { bad: 100, good: 0, neutral: 0 },
      id: 'invalid-all-bad-choice',
      outcomes: {
        bad: { result: { en: 'Bad' } },
        good: { result: { en: 'Good' } },
        neutral: { result: { en: 'Neutral' } },
      },
    };

    const outcome = resolveDecisionOutcome(decisionChoice, () => 0.5, {
      preventBadOutcome: true,
    });

    expect(outcome.type).toBe('good');
    expect(warnSpy).toHaveBeenCalledWith(
      'Good Decisions found no good or neutral chance for invalid-all-bad-choice; defaulting to good.'
    );
    warnSpy.mockRestore();
  });

  test('warns clearly when a choice chance total is invalid', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    warnForInvalidDecisionChances([
      {
        id: 'invalid-decision',
        choices: [
          {
            id: 'invalid-choice',
            chances: { good: 40, neutral: 20, bad: 20 },
          },
        ],
      },
    ]);

    expect(warnSpy).toHaveBeenCalledWith(
      'Decision chance total must equal 100: invalid-decision/invalid-choice totals 80.'
    );
    warnSpy.mockRestore();
  });
});
