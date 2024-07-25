do $$
declare
	r record;
begin
	for r in (
		select table_schema, table_name, constraint_name
		from information_schema.table_constraints
		where constraint_type = 'FOREIGN KEY'
	) loop
		raise info '%', 'dropping ' || r.constraint_name;
		execute concat(
			'alter table ', r.table_schema, '.', r.table_name,
			' drop constraint ', r.constraint_name
		);
	end loop;
end;
$$;


alter table notification.Notification
add constraint fkey_notification_Notification__type_id
foreign key (
	type_id
) references notification.Notification_Type (
	id
);

alter table notification.Account_Notification
add constraint fkey_notification_Account_Notification__receiver_aid
foreign key (
	receiver_aid
) references account.Account (
	id
);

alter table notification.Account_Notification
add constraint fkey_notification_Account_Notification__notification_id
foreign key (
	notification_id
) references notification.Notification (
	id
);

alter table notification.Account_Notification_Settings
add constraint fkey_notification_Account_Notification_Settings__account_id
foreign key (
	account_id
) references account.Account (
	id
);