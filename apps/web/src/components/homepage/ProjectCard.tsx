import Link from 'next/link';
import Image from 'next/image';

interface ProjectCardProps {
    slug: string;
    name: string;
    description: string | null;
    icon: string | null;
    rating: number | null;
    memberCount: number;
    category: string | null;
    tags: string[];
}

export default function ProjectCard({
    slug,
    name,
    description,
    icon,
    rating,
    memberCount,
    category,
    tags,
}: ProjectCardProps) {
    return (
        <Link href={`/communities/${slug}`}>
            <div className="group h-full p-4 rounded-lg border border-[rgba(0,212,255,0.2)] bg-gradient-to-br from-[#0a0a0a] to-[#000000] hover:border-[#00ff41] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,65,0.2)] cursor-pointer">
                {/* Community Icon */}
                <div className="flex items-start gap-3 mb-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-black flex-shrink-0">
                        {icon ? (
                            <Image src={icon} alt={name} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-[#00d4ff]">
                                {name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-white group-hover:text-[#00ff41] transition-colors truncate">
                            {name}
                        </h3>
                        {category && (
                            <div className="text-[10px] text-gray-400 mt-1 px-2 py-0.5 rounded bg-[rgba(0,212,255,0.1)] inline-block">
                                {category}
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-400 mb-3 line-clamp-2 min-h-[32px]">
                    {description || 'No description available'}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-[rgba(0,212,255,0.1)]">
                    <div className="flex items-center gap-3">
                        {/* Rating */}
                        {rating !== null && (
                            <div className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5 text-[#00ff41]" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="text-xs text-white font-medium">{rating.toFixed(1)}</span>
                            </div>
                        )}

                        {/* Member Count */}
                        <div className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                            <span className="text-xs text-gray-400">{memberCount}</span>
                        </div>
                    </div>

                    {/* View Arrow */}
                    <div className="text-[#00d4ff] group-hover:translate-x-1 transition-transform">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>

                {/* Tags */}
                {tags && tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {tags.slice(0, 3).map(tag => (
                            <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(0,212,255,0.1)] text-[#00d4ff]"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    );
}
