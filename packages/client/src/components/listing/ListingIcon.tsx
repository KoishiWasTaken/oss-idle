/** An add-on's or skin's icon, or its initial on a placeholder tile. */
export default function ListingIcon({
	url,
	name,
}: {
	url: string | undefined,
	name: string
}) {
	return url
		? <img className='listing__icon' src={url} alt='' />
		: <div className='listing__icon listing__icon--empty'>
			{name.slice(0, 1).toUpperCase()}
		</div>;
}
