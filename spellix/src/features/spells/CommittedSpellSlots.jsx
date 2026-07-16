import CommittedSpellSlotList from '../../components/spells/CommittedSpellSlotList';

function CommittedSpellSlots({ language, spellSlots, title = 'Spells', titleClassName = '' }) {
  return (
    <CommittedSpellSlotList
      language={language}
      spellSlots={spellSlots}
      title={title}
      titleClassName={titleClassName}
    />
  );
}

export default CommittedSpellSlots;
