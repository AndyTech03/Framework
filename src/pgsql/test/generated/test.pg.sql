create or replace function
test.create_test(
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
	_id := nextval(pg_get_serial_sequence('test.Test', 'id'));
	_id1 := nextval(pg_get_serial_sequence('test.Test', 'id1'));
	_id2 := nextval(pg_get_serial_sequence('test.Test', 'id2'));
	_id5 := nextval(pg_get_serial_sequence('test.Test', 'id5'));

	return query insert into test.Test (
		id, id1, id2, id3, id4, id5
	) values (
		_id, _id1, _id2, _id3, _id4, _id5
	) returning Test.id, Test.id1, Test.id2, Test.id3, Test.id4, Test.id5;
	return;
end;
$$;

create or replace function
test.select_test(
	_id bigint,
	_id1 integer,
	_id2 smallint,
	_id3 integer,
	_id4 integer,
	_id5 integer
)
returns test.Test
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'test.Test', exists(
			select from test.Test
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
		select Test
		from test.Test
		where
			id = _id and
			id1 = _id1 and
			id2 = _id2 and
			id3 = _id3 and
			id4 = _id4 and
			id5 = _id5
	);
end;
$$;

create or replace procedure
test.update_test(
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
test.delete_test(
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
		'test.Test', exists(
			select from test.Test
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

	delete from test.Test where
		id = _id and
		id1 = _id1 and
		id2 = _id2 and
		id3 = _id3 and
		id4 = _id4 and
		id5 = _id5;
end;
$$;

create or replace function
test.find_all_test(
	_id bigint default null,
	_id1 integer default null,
	_id2 smallint default null,
	_id3 integer default null,
	_id4 integer default null,
	_id5 integer default null
)
returns setof test.Test
language plpgsql as $$
begin
	return query select *
		from test.Test
		where
			(_id is null or id = _id) and
			(_id1 is null or id1 = _id1) and
			(_id2 is null or id2 = _id2) and
			(_id3 is null or id3 = _id3) and
			(_id4 is null or id4 = _id4) and
			(_id5 is null or id5 = _id5);
end;
$$;

