create or replace function
account.create_account(
	_state_id smallint,
	_role_id smallint,
	_email text,
	_phone text,
	_password text,
	_name text,
	_second_name text,
	_last_name text,
	_birthday timestamp without time zone
)
returns table(id bigint)
language plpgsql as $$
declare
	_id bigint;
begin
	_id := nextval(pg_get_serial_sequence('account.Account', 'id'));

	return query insert into account.Account (
		id, state_id, role_id, email, phone, password, name, second_name, last_name, birthday
	) values (
		_id, _state_id, _role_id, _email, _phone, _password, _name, _second_name, _last_name, _birthday
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
	_id bigint,
	_state_id smallint default null,
	_role_id smallint default null,
	_email text default null,
	_phone text default null,
	_password text default null,
	_name text default null,
	_second_name text default null,
	_last_name text default null,
	_birthday timestamp without time zone default null,
	_registration_date timestamp without time zone default null
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

	update account.Account set
		state_id = coalesce(_state_id, state_id),
		role_id = coalesce(_role_id, role_id),
		email = coalesce(_email, email),
		phone = coalesce(_phone, phone),
		password = coalesce(_password, password),
		name = coalesce(_name, name),
		second_name = coalesce(_second_name, second_name),
		last_name = coalesce(_last_name, last_name),
		birthday = coalesce(_birthday, birthday),
		registration_date = coalesce(_registration_date, registration_date)
	where
		id = _id;
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
	_id text default '',
	_state_id text default '',
	_role_id text default '',
	_email text default '',
	_phone text default '',
	_password text default '',
	_name text default '',
	_second_name text default '',
	_last_name text default '',
	_birthday text default '',
	_registration_date text default ''
)
returns setof account.Account
language plpgsql as $$
begin
	return query select *
		from account.Account
		where
			(_id is null or _id = '' or (id::text ~ ('^' || _id || '$'))) and
			(_state_id is null or _state_id = '' or (state_id::text ~ ('^' || _state_id || '$'))) and
			(_role_id is null or _role_id = '' or (role_id::text ~ ('^' || _role_id || '$'))) and
			(_email is null or _email = '' or (email::text ~ ('^' || _email || '$'))) and
			(_phone is null or _phone = '' or (phone::text ~ ('^' || _phone || '$'))) and
			(_password is null or _password = '' or (password::text ~ ('^' || _password || '$'))) and
			(_name is null or _name = '' or (name::text ~ ('^' || _name || '$'))) and
			(_second_name is null or _second_name = '' or (second_name::text ~ ('^' || _second_name || '$'))) and
			(_last_name is null or _last_name = '' or (last_name::text ~ ('^' || _last_name || '$'))) and
			(_birthday is null or _birthday = '' or (birthday::text ~ ('^' || _birthday || '$'))) and
			(_registration_date is null or _registration_date = '' or (registration_date::text ~ ('^' || _registration_date || '$')));
end;
$$;

