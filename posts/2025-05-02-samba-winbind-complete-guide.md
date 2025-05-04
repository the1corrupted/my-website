# 2025-05-02 Complete Guide: Samba + Winbind Active Directory Integration on Debian 12 (Privileged Container, Proxmox VE)

This guide configures a Debian 12 privileged container for use with Samba and Winbind, integrating with Active Directory to support user authentication and ACL-managed file shares.

---

## 📝 Notes

- This setup **does not use SSSD**.
- **Winbind is required** for Samba ACL resolution with Active Directory.
- Privileged containers simplify ID and ACL handling without UID remapping.

---

## Step 1. Container Privilege Setup (Proxmox Host)

Edit `/etc/pve/lxc/300.conf` on the Proxmox host:

```ini
unprivileged: 0
features: keyctl=1
```

Restart the container to apply.

---

## Step 2. Install Required Packages

```bash
apt update && apt upgrade -y
apt install -y krb5-user samba smbclient keyutils winbind libnss-winbind libpam-winbind acl
```

---

## Step 3. Configure Kerberos `/etc/krb5.conf`

```ini
[libdefaults]
    default_realm = DOMAIN.LOCAL
    dns_lookup_realm = false
    dns_lookup_kdc = true

[realms]
    AD.NECRODEX.IO = {
        kdc = domain.local
        admin_server = domain.local
    }

[domain_realm]
    .ad.necrodex.io = DOMAIN.LOCAL
    ad.necrodex.io = DOMAIN.LOCAL
```

---

## Step 4. Configure Samba `/etc/samba/smb.conf`

Make sure to change the domain entries to match your local domain. Workgroup is the domain POSIX name, and realm is the full domain name as defined in `/etc/krb5.conf`.

```ini
[global]
   workgroup = DOMLOCAL
   realm = DOMAIN.LOCAL
   security = ADS
   kerberos method = secrets and keytab
   dedicated keytab file = /etc/krb5.keytab
   log file = /var/log/samba/%m.log
   log level = 1

   idmap config * : backend = tdb
   idmap config * : range = 3000-7999

   idmap config DOMLOCAL : backend = rid
   idmap config DOMLOCAL : range = 10000-999999

   winbind use default domain = yes
   winbind offline logon = false
   winbind enum users = yes
   winbind enum groups = yes

   template shell = /bin/bash
   template homedir = /home/%U

   vfs objects = acl_xattr
   map acl inherit = yes
   store dos attributes = yes
   ea support = yes


```

---

## Step 5. Join the Domain

```bash
net ads join -U administrator
```

Check status:

```bash
net ads testjoin
```

---

## Step 6. Configure NSS `/etc/nsswitch.conf`

```ini
passwd:         files systemd winbind
group:          files systemd winbind
shadow:         files systemd winbind
gshadow:        files systemd winbind
```

---

## Step 7. Enable and Restart Services

```bash
systemctl restart smbd nmbd winbind
systemctl enable smbd nmbd winbind
```

---

## Step 8. Verify Domain Users & Groups

```bash
wbinfo -u
wbinfo -g
getent passwd administrator
getent group "domain users"
```

---

## Step 9. (Optional) Enable Home Directory Creation

```bash
pam-auth-update --enable mkhomedir
```

Creates home directories on first login via PAM.

---

## Step 10. Prepare the Share Directory

```bash
mkdir -p /srv/samba/shared
chown root:"domain users" /srv/samba/shared
chmod 2770 /srv/samba/shared
setfacl -m g:"domain users":rwx /srv/samba/shared
```

Ensure the filesystem supports ACLs:

```bash
mount | grep /srv/samba/shared
tune2fs -l /dev/mapper/pve-vm--300--disk--1 | grep 'Default mount options'
```

Enable the share from `/etc/samba/smb.conf` by adding the share properties at the end

```ini
[Shared]
   path = /srv/samba/shared
   read only = no
   browsable = yes
   guest ok = no
   create mask = 0660
   directory mask = 0770
```

**Optional:** Introduce role-based access control directly on the share by specifying **valid users** and/or **valid groups** at the end of the share definition:

```ini
valid groups = "domain admin","domain users"
valid users = "domain_user1@domain.local","administrator@domain.local"
```

The fully qualified domain user name is preferred here, but not necessarily required since UID and GID translation is enabled on the server from previous steps.
