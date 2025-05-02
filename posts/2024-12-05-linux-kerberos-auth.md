# Integrating Linux with Active Directory via Kerberos

If you're configuring a Debian server to authenticate against AD, you're going to fight both dragons and wizards. Start here:

- Ensure `krb5-user` and `sssd` are installed
- Configure `/etc/krb5.conf` and `/etc/sssd/sssd.conf` manually
- Validate with `kinit` and `id`

```bash
kinit youruser@YOURDOMAIN
id youruser
```

It's not impossible — just undocumented. But when it works, it's magic.