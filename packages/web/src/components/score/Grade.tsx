import './Grade.css';

import { Grade as GradeName } from '@oss-idle/shared/grade';

import { Asset } from '../../router';

export default function Grade({
	grade,
}: {
	grade: GradeName
}) {
	return (<div className='grade__container'>
		<div 
			className='grade__img' 
			style={{ backgroundImage: `url('${Asset(`/img/grade/grade-${grade}.svg`)}')` }}
		>
		</div>
	</div>);
}