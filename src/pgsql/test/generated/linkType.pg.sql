create or replace function
test.find_all_link_type(
	_id smallint default null,
	_slug text default null,
	_title text default null,
	_description text default null
)
returns setof test.Link_Type
language plpgsql as $$
begin
	return query select *
		from test.Link_Type
		where
			(_id is null or id = _id) and
			(_slug is null or slug = _slug) and
			(_title is null or title = _title) and
			(_description is null or description = _description);
end;
$$;

