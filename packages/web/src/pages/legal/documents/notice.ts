import type { Bilingual } from './types';
import {
	ADDRESS,
	EMAIL,
	HOST,
	PUBLISHER,
	SIRET,
	STATUS,
	VAT_NUMBER,
} from '../identity';

export const notice: Bilingual = {
	en: {
		title: 'Legal Notice',
		sections: [
			{
				title: 'Publisher',
				blocks: [
					{
						list: [
							`${PUBLISHER}, ${STATUS}`,
							`Address: ${ADDRESS}`,
							`SIRET: ${SIRET}`,
							`Intra-EU VAT number: ${VAT_NUMBER}`,
							'VAT not applicable, article 293 B of the French General Tax Code',
							`Contact: ${EMAIL}`,
							`Publication director: ${PUBLISHER}`,
						],
					},
				],
			},
			{
				title: 'Hosting',
				blocks: [HOST],
			},
			{
				title: 'Not affiliated with osu!',
				blocks: [
					'oss!idle is an unofficial fan game, not made, endorsed or supported by ppy Pty Ltd. osu! is a trademark of ppy Pty Ltd.',
				],
			},
			{
				title: 'Credits',
				blocks: [
					{
						list: [
							'IP Geolocation by DB-IP (https://db-ip.com), licensed under CC BY 4.0.',
							'World map from Natural Earth (https://www.naturalearthdata.com), public domain.',
							'Grade badges and guest avatar from osu!web (https://github.com/ppy/osu-web) by ppy Pty Ltd, licensed under the GNU AGPL v3.',
							'Flags from Twemoji (https://github.com/jdecked/twemoji), licensed under CC BY 4.0.',
							'Exo 2 font by Natanael Gama, licensed under the SIL Open Font License 1.1.',
							'Urbanist font by the Urbanist Project Authors (https://github.com/coreyhu/Urbanist), licensed under the SIL Open Font License 1.1.',
							'The source code of oss!idle is published under the GNU AGPL v3: https://github.com/oss-idle/oss-idle',
						],
					},
				],
			},
		],
	},
	fr: {
		title: 'Mentions légales',
		sections: [
			{
				title: 'Éditeur',
				blocks: [
					{
						list: [
							`${PUBLISHER}, ${STATUS}`,
							`Adresse : ${ADDRESS}`,
							`SIRET : ${SIRET}`,
							`N° de TVA intracommunautaire : ${VAT_NUMBER}`,
							'TVA non applicable, article 293 B du CGI',
							`Contact : ${EMAIL}`,
							`Directeur de la publication : ${PUBLISHER}`,
						],
					},
				],
			},
			{
				title: 'Hébergement',
				blocks: [HOST],
			},
			{
				title: 'Aucun lien avec osu!',
				blocks: [
					'oss!idle est un jeu de fan non officiel, ni réalisé, ni approuvé, ni soutenu par ppy Pty Ltd. osu! est une marque de ppy Pty Ltd.',
				],
			},
			{
				title: 'Crédits',
				blocks: [
					{
						list: [
							'Géolocalisation IP par DB-IP (https://db-ip.com), sous licence CC BY 4.0.',
							'Carte du monde issue de Natural Earth (https://www.naturalearthdata.com), domaine public.',
							'Badges de rang et avatar invité issus d\'osu!web (https://github.com/ppy/osu-web) par ppy Pty Ltd, sous licence GNU AGPL v3.',
							'Drapeaux issus de Twemoji (https://github.com/jdecked/twemoji), sous licence CC BY 4.0.',
							'Police Exo 2 par Natanael Gama, sous licence SIL Open Font License 1.1.',
							'Police Urbanist par les auteurs du projet Urbanist (https://github.com/coreyhu/Urbanist), sous licence SIL Open Font License 1.1.',
							'Le code source d\'oss!idle est publié sous licence GNU AGPL v3 : https://github.com/oss-idle/oss-idle',
						],
					},
				],
			},
		],
	},
};
