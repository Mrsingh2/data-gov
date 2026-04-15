import Link from 'next/link';
import { Dataset } from '@/types/api';
import { AccessBadge, VisibilityBadge } from '@/components/ui/Badge';

interface Props {
  dataset: Dataset;
}

export default function DatasetCard({ dataset }: Props) {
  return (
    <Link href={`/datasets/${dataset.id}`} className="block">
      <div className="card p-5 hover:border-blue-200 hover:shadow-md transition-all h-full">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
            {dataset.title}
          </h3>
          <AccessBadge level={dataset.accessClassification} />
        </div>
        <p className="text-gray-500 text-xs line-clamp-2 mb-3">{dataset.description}</p>

        {dataset.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {dataset.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-2 border-t border-gray-50">
          <span>{dataset.owner?.name || 'Unknown'}</span>
          <div className="flex items-center gap-3">
            <span>{dataset.viewCount ?? 0} views</span>
            <span>{dataset.downloadCount ?? 0} downloads</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
