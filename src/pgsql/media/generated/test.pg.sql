create or replace function
media.create_test(
	_id3 integer,
	_id4 integer
)
returns table(id bigint, id1 integer, id2 smallint, id3 integer, id4 integer, id5 integer)
language plpgsql as $$
declare
	_id bigint;
	_id1 integer;
	_id2 smallint;
	_id5 integer;
begin
	_id := nextval(pg_get_serial_sequence('media.Test', 'id'));
	_id1 := nextval(pg_get_serial_sequence('media.Test', 'id1'));
	_id2 := nextval(pg_get_serial_sequence('media.Test', 'id2'));
	_id5 := nextval(pg_get_serial_sequence('media.Test', 'id5'));

	return query insert into media.Test (
		id, id1, id2, id3, id4, id5
	) values (
		_id, _id1, _id2, _id3, _id4, _id5
	) returning Test.id, Test.id1, Test.id2, Test.id3, Test.id4, Test.id5;
	return;
end;
$$;

create or replace function
media.select_test(
	_id bigint,
	_id1 integer,
	_id2 smallint,
	_id3 integer,
	_id4 integer,
	_id5 integer
)
returns media.Test
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'media.Test', exists(
			select from media.Test
			where
				id = _id and
				id1 = _id1 and
				id2 = _id2 and
				id3 = _id3 and
				id4 = _id4 and
				id5 = _id5
		), json_build_object(
			'_id', _id,
			'_id1', _id1,
			'_id2', _id2,
			'_id3', _id3,
			'_id4', _id4,
			'_id5', _id5
		)
	);

	return (
		select *
		from media.Test
		where
			id = _id and
			id1 = _id1 and
			id2 = _id2 and
			id3 = _id3 and
			id4 = _id4 and
			id5 = _id5
		limit 1
	);
end;
$$;

create or replace procedure
media.update_test(
	_id bigint,
	_id1 integer,
	_id2 smallint,
	_id3 integer,
	_id4 integer,
	_id5 integer
)
language plpgsql as $$
begin
	-- Nothing to update!
end;
$$;

create or replace procedure
media.delete_test(
	_id bigint,
	_id1 integer,
	_id2 smallint,
	_id3 integer,
	_id4 integer,
	_id5 integer
)
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'media.Test', exists(
			select from media.Test
			where
				id = _id and
				id1 = _id1 and
				id2 = _id2 and
				id3 = _id3 and
				id4 = _id4 and
				id5 = _id5
		), json_build_object(
			'_id', _id,
			'_id1', _id1,
			'_id2', _id2,
			'_id3', _id3,
			'_id4', _id4,
			'_id5', _id5
		)
	);

	delete from media.Test where
		id = _id and
		id1 = _id1 and
		id2 = _id2 and
		id3 = _id3 and
		id4 = _id4 and
		id5 = _id5;
end;
$$;

