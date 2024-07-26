create or replace function
notification.create_account_notification(
	_receiver_aid bigint,
	_notification_id bigint,
	_status json
)
returns table(id bigint)
language plpgsql as $$
declare
	_id bigint;
begin
	_id := nextval(pg_get_serial_sequence('notification.Account_Notification', 'id'));

	return query insert into notification.Account_Notification (
		id, receiver_aid, notification_id, status
	) values (
		_id, _receiver_aid, _notification_id, _status
	) returning Account_Notification.id;
	return;
end;
$$;

create or replace function
notification.select_account_notification(
	_id bigint
)
returns notification.Account_Notification
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'notification.Account_Notification', exists(
			select from notification.Account_Notification
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	return (
		select Account_Notification
		from notification.Account_Notification
		where
			id = _id
	);
end;
$$;

create or replace procedure
notification.update_account_notification(
	_id bigint,
	_receiver_aid bigint default null,
	_notification_id bigint default null,
	_status json default null
)
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'notification.Account_Notification', exists(
			select from notification.Account_Notification
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	update notification.Account_Notification set
		receiver_aid = coalesce(_receiver_aid, receiver_aid),
		notification_id = coalesce(_notification_id, notification_id),
		status = coalesce(_status, status)
	where
		id = _id;
end;
$$;

create or replace procedure
notification.delete_account_notification(
	_id bigint
)
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'notification.Account_Notification', exists(
			select from notification.Account_Notification
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	delete from notification.Account_Notification where
		id = _id;
end;
$$;

create or replace function
notification.find_all_account_notification(
	_id text default '',
	_receiver_aid text default '',
	_notification_id text default '',
	_status text default ''
)
returns setof notification.Account_Notification
language plpgsql as $$
begin
	return query select *
		from notification.Account_Notification
		where
			(_id is null or _id = '' or (id::text ~ ('^' || _id || '$'))) and
			(_receiver_aid is null or _receiver_aid = '' or (receiver_aid::text ~ ('^' || _receiver_aid || '$'))) and
			(_notification_id is null or _notification_id = '' or (notification_id::text ~ ('^' || _notification_id || '$'))) and
			(_status is null or _status = '' or (status::text ~ ('^' || _status || '$')));
end;
$$;

