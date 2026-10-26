import {
	ph,
	t,
} from '@lingui/core/macro';

import Log from '@oss-idle/shared/helpers/log';
import Synced from '@oss-idle/shared/helpers/synced';
import type { SkinStatus } from '@oss-idle/shared/skin';

import type { Skin as SkinDTO } from '../../online/skins';
import { currentSkinDAO } from '../../osu/skin/Skin';
import { deleteSkinFiles } from '../../osu/skin/skinFiles';
import {
	boolean,
	DAO,
	integer,
	table,
	text,
} from '../dao';
import { SETTINGS } from '../settings';

const skin = table('skin', {
	id:          integer().primaryKey(),
	name:        text(),
	description: text(),
	version:     text(),
	icon:        text().nullable(),
	authorId:    integer(),
	authorName:  text(),
	tags:        text(),
	status:      text<SkinStatus>(),
	enabled:     boolean(),
	installedAt: integer(),
	createdAt:   text(),
	publishedAt: text().nullable(),
	updatedAt:   text(),
});

export class SkinDAO extends DAO(skin) {

	// Every persist refreshes the reactive list, so install / update / enable /
	// uninstall reach every view through `installedSkins` with no manual signal.
	async add(): Promise<this> {
		const r = await super.add();
		await reloadInstalledSkins();
		return r;
	}

	async update(patch?: Partial<SkinDAO>): Promise<this> {
		const r = await super.update(patch);
		await reloadInstalledSkins();
		return r;
	}

	async delete(): Promise<void> {
		await super.delete();
		await deleteSkinFiles(this.id);
		await reloadInstalledSkins();
	}

	async setEnabled(enabled: boolean, ignore = false): Promise<void> {
		this.enabled = enabled;
		try {
			if (!ignore) {
				(await SkinDAO.getAll())
					.filter(skin => skin.id !== this.id && skin.enabled)
					.forEach(skin => skin.setEnabled(false, true))
				;
			}
			if (enabled) {
				currentSkinDAO.set(this);
			} else if (!ignore) {
				currentSkinDAO.set(undefined);
			}
			await this.update({ enabled });
		} catch {
			Log.errorPopup(t`Unable to load "${ph({ skin: this.name })}"`);
		}
	}

	async uninstall(): Promise<void> {
		await this.delete();
		this.letGo();
	}

	/** Drop its row, its folder being gone already. */
	async forget(): Promise<void> {
		await super.delete();
		await reloadInstalledSkins();
		this.letGo();
	}

	private letGo(): void {
		if (currentSkinDAO.get()?.id === this.id) currentSkinDAO.set(undefined);
		if (SETTINGS.editorSkin.get() === this.id) SETTINGS.editorSkin.set(0);
	}

	/** Not from the catalog: imported from the player's own files. */
	get local(): boolean {
		return this.id < 0;
	}

	public static async getEnabled(): Promise<SkinDAO | undefined> {
		return SkinDAO.first('SELECT * FROM skin WHERE enabled = 1 LIMIT 1');
	}

	public static fromSkinDTO(dto: SkinDTO): SkinDAO {
		const dao = new SkinDAO({
			...dto,
			tags: dto.tags.join(','),
			enabled: false,
			installedAt: Date.now(),
		});

		return dao;
	}

	/** Its listing, to show it like a catalog skin. */
	public toDetail() {
		return {
			name: this.name,
			description: this.description,
			version: this.version,
			icon: this.icon,
			tags: this.tags ? this.tags.split(',') : [],
			...this.authorName ? { authorName: this.authorName } : {},
		};
	}
}

/**
 * Reactive list of installed skins - the single source of truth the skin lists
 * render from, kept current by the DAO write methods above.
 */
export const installedSkins = new Synced<SkinDAO[]>([]);

const reloadInstalledSkins = async (): Promise<void> => {
	installedSkins.set(await SkinDAO.getAll());
};

void reloadInstalledSkins();