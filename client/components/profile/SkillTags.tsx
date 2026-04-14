import Badge from '../ui/Badge';
import { classNames } from '../../utils/helpers';
import type { SkillDetailed } from '../../types/user.types';

interface SkillTagsProps {
  skills: string[];
  skillsDetailed?: SkillDetailed[];
  title?: string;
  maxVisible?: number;
  emptyMessage?: string;
  className?: string;
}

const levelStyleMap: Record<SkillDetailed['level'], string> = {
  beginner: 'bg-blue-50 text-blue-700 border-blue-200',
  intermediate: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  advanced: 'bg-orange-50 text-orange-700 border-orange-200',
  expert: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function SkillTags({
  skills,
  skillsDetailed = [],
  title = 'Skills',
  maxVisible,
  emptyMessage = 'No skills added yet',
  className,
}: SkillTagsProps) {
  const normalizedSkills = skills.filter((skill) => skill.trim().length > 0);
  const normalizedDetailed = skillsDetailed.filter((skill) => skill.name.trim().length > 0);
  const hasDetailed = normalizedDetailed.length > 0;
  const visibleSkills = typeof maxVisible === 'number' ? normalizedSkills.slice(0, maxVisible) : normalizedSkills;
  const hiddenCount = normalizedSkills.length - visibleSkills.length;

  const groupedDetailed = normalizedDetailed.reduce<Record<string, SkillDetailed[]>>((acc, item) => {
    const key = item.level;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <section className={classNames('rounded-xl border border-zinc-200 bg-white p-5 shadow-sm', className)}>
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>

      {normalizedSkills.length === 0 && !hasDetailed ? (
        <p className="mt-2 text-sm text-zinc-500">{emptyMessage}</p>
      ) : (
        <div className="mt-3 space-y-3">
          {hasDetailed
            ? Object.entries(groupedDetailed).map(([level, skillItems]) => (
                <div key={level}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">{level}</p>
                  <div className="flex flex-wrap gap-2">
                    {skillItems.map((skill) => (
                      <span
                        key={`${skill.name}-${skill.level}`}
                        className={classNames(
                          'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                          levelStyleMap[skill.level],
                        )}
                      >
                        {skill.name}
                        <span className="capitalize opacity-80">{skill.level}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))
            : null}

          {!hasDetailed ? (
            <div className="flex flex-wrap gap-2">
              {visibleSkills.map((skill) => (
                <Badge key={skill} variant="default" className="text-sm">
                  {skill}
                </Badge>
              ))}
              {hiddenCount > 0 ? <Badge variant="info">+{hiddenCount} more</Badge> : null}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
