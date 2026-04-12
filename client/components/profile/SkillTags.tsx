import Badge from '../ui/Badge';
import { classNames } from '../../utils/helpers';

interface SkillTagsProps {
  skills: string[];
  title?: string;
  maxVisible?: number;
  emptyMessage?: string;
  className?: string;
}

export default function SkillTags({
  skills,
  title = 'Skills',
  maxVisible,
  emptyMessage = 'No skills added yet',
  className,
}: SkillTagsProps) {
  const normalizedSkills = skills.filter((skill) => skill.trim().length > 0);
  const visibleSkills = typeof maxVisible === 'number' ? normalizedSkills.slice(0, maxVisible) : normalizedSkills;
  const hiddenCount = normalizedSkills.length - visibleSkills.length;

  return (
    <section className={classNames('rounded-xl border border-zinc-200 bg-white p-5 shadow-sm', className)}>
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>

      {normalizedSkills.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">{emptyMessage}</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleSkills.map((skill) => (
            <Badge key={skill} variant="default" className="text-sm">
              {skill}
            </Badge>
          ))}

          {hiddenCount > 0 ? <Badge variant="info">+{hiddenCount} more</Badge> : null}
        </div>
      )}
    </section>
  );
}
