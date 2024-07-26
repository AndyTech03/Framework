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
	_id text default '',
	_type_id text default '',
	_source text default '',
	_content text default '',
	_notification_date text default ''
)
returns setof notification.Notification
language plpgsql as $$
begin
	return query select *
		from notification.Notification
		where
			(_id is null or _id = '' or (id::text ~ ('^' || _id || '$'))) and
			(_type_id is null or _type_id = '' or (type_id::text ~ ('^' || _type_id || '$'))) and
			(_source is null or _source = '' or (source::text ~ ('^' || _source || '$'))) and
			(_content is null or _content = '' or (content::text ~ ('^' || _content || '$'))) and
			(_notification_date is null or _notification_date = '' or (notification_date::text ~ ('^' || _notification_date || '$')));
end;
$$;

