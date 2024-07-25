create or replace function
account.create_account()
returns table(id bigint)
language plpgsql as $$
declare
	_id bigint;
begin
	_id := nextval(pg_get_serial_sequence('account.Account', 'id'));

	return query insert into account.Account (
		id
	) values (
		_id
	) returning Account.id;
	return;
end;
$$;

create or replace function
account.select_account(
	_id bigint
)
returns account.Account
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'account.Account', exists(
			select from account.Account
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	return (
		select Account
		from account.Account
		where
			id = _id
	);
end;
$$;

create or replace procedure
account.update_account(
	_id bigint
)
language plpgsql as $$
begin
	-- Nothing to update!
end;
$$;

create or replace procedure
account.delete_account(
	_id bigint
)
language plpgsql as $$
begin
	perform debug.not_found_handler(
		'account.Account', exists(
			select from account.Account
			where
				id = _id
		), json_build_object(
			'_id', _id
		)
	);

	delete from account.Account where
		id = _id;
end;
$$;

create or replace function
account.find_all_account(
	_id bigint default null
)
returns setof account.Account
language plpgsql as $$
begin
	return query select *
		from account.Account
		where
			(_id is null or id = _id);
end;
$$;

