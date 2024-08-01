-- Array Foreign Key Check Function
create or replace function
utils.array_fkey_chech(
	_array text,
	_table text,
	_column text
)
returns boolean
language plpgsql as $$
declare
	_result boolean;
begin
	execute concat(
		'select array_agg(', _column, ') @> ''', _array, '''',
        'from ', _table
	) into _result;
	return _result;
end;
$$;