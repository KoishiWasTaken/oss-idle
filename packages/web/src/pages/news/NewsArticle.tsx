import './News.css';

import { isAdmin } from '@oss-idle/shared/groups';
import {
	NEWS_TAGS,
	type NewsDTO,
} from '@oss-idle/shared/news';

import { formatDate } from '../../api/news';
import Link from '../../components/Link';
import {
	coverImage,
	tagGradient,
} from '../../components/NewsCard';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export default function NewsArticle({ article }: { article: NewsDTO }) {
	const user = useCurrentUser();

	const tag = NEWS_TAGS[article.tag];
	const image = coverImage(article);

	return (
		<main className="page-contents">
			<Link to="/news" className="news-back">← All news</Link>

			<article>
				<div
					className="news-article__banner"
					style={image ? { backgroundImage: `url(${image})` } : { background: tagGradient(tag.hue) }}
				>
					<span className="news-card__tag" style={{ background: `hsl(${tag.hue} 55% 42%)` }}>
						{tag.label}
					</span>
				</div>

				<time className="news-article__date">{formatDate(article.publishedAt)}</time>
				<h1 className="news-article__title">{article.title}</h1>
				<p className="news-article__byline">by {article.authorName}</p>

				{/* Trusted HTML - authored by an admin. */}
				<div className="news-article__body" dangerouslySetInnerHTML={{ __html: article.content }} />

				{isAdmin(user?.groups) && (
					<Link to="/news/admin" className="news-btn news-article__edit">Edit in admin</Link>
				)}
			</article>
		</main>
	);
}
