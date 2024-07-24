create or replace function
notification.create_notification(
	_type_id smallint,
	_source json,
	_content json,
	_notification_date timestamp without time zone
)
returns table(id bigint)
language plpgsql as $$
declare
	_id bigint;
begin
	_id := nextval(pg_get_serial_sequence('notification.Notification', 'id'));

	return query insert into notification.Notification (
		id, type_id, source, content, notification_date
	) values (
		_id, _type_id, _source, _content, _notification_date
	) returning Notification.id;
	return;
end;
$$;

create or replace function
notification.select_notification(
	_id bigint
)
returns notification.Notification
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'notification.Notification', exists(
			select from notification.Notification
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	return (
		select Notification
		from notification.Notification
		where
			id = _id
	);
end;
$$;

create or replace procedure
notification.update_notification(
	_id bigint,
	_type_id smallint default null,
	_source json default null,
	_content json default null,
	_notification_date timestamp without time zone default null
)
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'notification.Notification', exists(
			select from notification.Notification
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	update notification.Notification set
		type_id = coalesce(_type_id, type_id),
		source = coalesce(_source, source),
		content = coalesce(_content, content),
		notification_date = coalesce(_notification_date, notification_date)
	where
		id = _id;
end;
$$;

create or replace procedure
notification.delete_notification(
	_id bigint
)
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'notification.Notification', exists(
			select from notification.Notification
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	delete from notification.Notification where
		id = _id;
end;
$$;

create or replace function
notification.find_all_notification(
	_id bigint default null,
	_type_id smallint default null,
	_source json default null,
	_content json default null,
	_notification_date timestamp without time zone default null
)
returns setof notification.Notification
language plpgsql as $$
begin
	return query select *
		from notification.Notification
		where
			(_id is null or id = _id) and
			(_type_id is null or type_id = _type_id) and
			(_source is null or source = _source) and
			(_content is null or content = _content) and
			(_notification_date is null or notification_date = _notification_date);
end;
$$;

