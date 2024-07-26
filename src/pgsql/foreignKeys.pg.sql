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


alter table account.Account
add constraint fkey_account_Account__state_id
foreign key (
	state_id
) references account.Account_State (
	id
);

alter table account.Account
add constraint fkey_account_Account__role_id
foreign key (
	role_id
) references account.Account_Role (
	id
);

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