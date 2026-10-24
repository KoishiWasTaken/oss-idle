-- MakiseBot, our BanchoBot, gets a profile: character 1, owned by osu!'s BanchoBot id, which no one can sign in as.
INSERT INTO `user` (`id`, `username`, `avatar_url`, `country`, `current_character`, `keep_playing`)
	VALUES (3, 'MakiseBot', 'https://oss.idle.rhythmgamers.net/web/makisebot.png', 'JP', 1, false);
--> statement-breakpoint
INSERT INTO `character` (`id`, `user_id`, `name`, `user_page`)
	VALUES (1, 3, 'MakiseBot', '[size=150][centre]helping you help yourself[/centre][/size]
[centre][i]...not that I''m doing it for you or anything.[/i][/centre]

[box=Commands]
[b]!roll[/b] [i]number[/i] - rolls from 1 to 100, or to your number.
[/box]

[notice][centre]Lab Member No. 004 of the Future Gadget Laboratory.
[i]El Psy Kongroo.[/i][/centre][/notice]');
