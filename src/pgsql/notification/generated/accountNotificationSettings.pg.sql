create or replace function
notification.create_account_notification_settings(
	_account_id bigint,
	_settings json
)
returns table(id bigint)
language plpgsql as $$
declare
	_id bigint;
begin
	_id := nextval(pg_get_serial_sequence('notification.Account_Notification_Settings', 'id'));

	return query insert into notification.Account_Notification_Settings (
		id, account_id, settings
	) values (
		_id, _account_id, _settings
	) returning Account_Notification_Settings.id;
	return;
end;
$$;

create or replace function
notification.select_account_notification_settings(
	_id bigint
)
returns notification.Account_Notification_Settings
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'notification.Account_Notification_Settings', exists(
			select from notification.Account_Notification_Settings
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	return (
		select Account_Notification_Settings
		from notification.Account_Notification_Settings
		where
			id = _id
	);
end;
$$;

create or replace procedure
notification.update_account_notification_settings(
	_id bigint,
	_account_id bigint default null,
	_settings json default null
)
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'notification.Account_Notification_Settings', exists(
			select from notification.Account_Notification_Settings
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	update notification.Account_Notification_Settings set
		account_id = coalesce(_account_id, account_id),
		settings = coalesce(_settings, settings)
	where
		id = _id;
end;
$$;

create or replace procedure
notification.delete_account_notification_settings(
	_id bigint
)
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'notification.Account_Notification_Settings', exists(
			select from notification.Account_Notification_Settings
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	delete from notification.Account_Notification_Settings where
		id = _id;
end;
$$;

create or replace function
notification.find_all_account_notification_settings(
	_id text default '',
	_account_id text default '',
	_settings text default ''
)
returns setof notification.Account_Notification_Settings
language plpgsql as $$
begin
	return query select *
		from notification.Account_Notification_Settings
		where
			(_id is null or _id = '' or (id::text ~ ('^' || _id || '$'))) and
			(_account_id is null or _account_id = '' or (account_id::text ~ ('^' || _account_id || '$'))) and
			(_settings is null or _settings = '' or (settings::text ~ ('^' || _settings || '$')));
end;
$$;

