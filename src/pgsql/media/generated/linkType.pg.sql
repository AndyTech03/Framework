create or replace function
media.create_link_type(
	_slug text,
	_title text
)
returns table(id smallint)
language plpgsql as $$
declare
	_id smallint;
begin
	_id := nextval(pg_get_serial_sequence('media.Link_Type', 'id'));

	return query insert into media.Link_Type (
		id, slug, title
	) values (
		_id, _slug, _title
	) returning Link_Type.id;
	return;
end;
$$;

create or replace function
media.select_link_type(
	_id smallint
)
returns media.Link_Type
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'media.Link_Type', exists(
			select from media.Link_Type
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	return (
		select *
		from media.Link_Type
		where
			id = _id
	);
end;
$$;

create or replace procedure
media.update_link_type(
	_id smallint,
	_slug text default null,
	_title text default null,
	_description text default null
)
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'media.Link_Type', exists(
			select from media.Link_Type
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	update media.Link_Type set
		slug = coalesce(_slug, slug),
		title = coalesce(_title, title),
		description = coalesce(_description, description)
	where
		id = _id;
end;
$$;

create or replace procedure
media.delete_link_type(
	_id smallint
)
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'media.Link_Type', exists(
			select from media.Link_Type
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	delete from media.Link_Type where
		id = _id;
end;
$$;

