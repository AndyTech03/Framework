create or replace function
notification.create_notification_type(
	_slug text,
	_title text,
	_description text
)
returns table(id smallint)
language plpgsql as $$
declare
	_id smallint;
begin
	_id := nextval(pg_get_serial_sequence('notification.Notification_Type', 'id'));

	return query insert into notification.Notification_Type (
		id, slug, title, description
	) values (
		_id, _slug, _title, _description
	) returning Notification_Type.id;
	return;
end;
$$;

create or replace function
notification.select_notification_type(
	_id smallint
)
returns notification.Notification_Type
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'notification.Notification_Type', exists(
			select from notification.Notification_Type
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	return (
		select Notification_Type
		from notification.Notification_Type
		where
			id = _id
	);
end;
$$;

create or replace procedure
notification.update_notification_type(
	_id smallint,
	_slug text default null,
	_title text default null,
	_description text default null
)
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'notification.Notification_Type', exists(
			select from notification.Notification_Type
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	update notification.Notification_Type set
		slug = coalesce(_slug, slug),
		title = coalesce(_title, title),
		description = coalesce(_description, description)
	where
		id = _id;
end;
$$;

create or replace procedure
notification.delete_notification_type(
	_id smallint
)
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'notification.Notification_Type', exists(
			select from notification.Notification_Type
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	delete from notification.Notification_Type where
		id = _id;
end;
$$;

create or replace function
notification.find_all_notification_type(
	_id smallint default null,
	_slug text default null,
	_title text default null,
	_description text default null
)
returns setof notification.Notification_Type
language plpgsql as $$
begin
	return query select *
		from notification.Notification_Type
		where
			(_id is null or id = _id) and
			(_slug is null or slug = _slug) and
			(_title is null or title = _title) and
			(_description is null or description = _description);
end;
$$;

