---

## 2025-05-02 - IPv6: Getting Your Prefix

Setting up a managed IPv6 network with router advertisements (RA) is a foundational skill for modern system administrators. This article reflects my experience and approach to configuring such a network. I will begin by walking through the first major step: acquiring and applying your IPv6 prefix.

IPv6 is only scary because the numbers are bigger. Don't let those big numbers bully you. Don't be afraid just because they're longer, and "oh god they have **letters too**."

## Step 1: Get Your Existing Prefix

The very first building block of an IPv6 network is your **prefix**. An IPv6 prefix is essentially the base of your address range—everything from the network ID to your potential subnets derives from this.

### Why You Need the Prefix

- It defines your address scope.
- It's used in router advertisements to inform clients how to auto-configure addresses.
- It helps set routing and firewall policies.

Most ISPs or upstream providers allocate this when you sign up for service. It may look like this:

```text
2001:db8:abcd::/48
```

This example gives you a very large range of addresses—enough for thousands of /64 subnets.

### How to Find Your Existing Prefix

If you're already connected to an IPv6-enabled service, you can check your current address with:

```bash
ip -6 addr show
```

Look for the global scope addresses—something like `2001:db8:abcd:1::1/64`. From there, you can derive the prefix.

Alternatively, your router or modem may provide this information in its administrative dashboard under IPv6 status or WAN settings.

## No Prefix Yet? Generate a ULA for Lab Use

If you don’t yet have a prefix from an ISP, you can create your own **Unique Local Address (ULA)** prefix for internal or lab use.

Use an online ULA generator (e.g., [ULA Generator by SixXS](https://www.sixxs.net/tools/grh/ula/)) or generate one manually:

```bash
openssl rand -hex 5 | sed 's/\(..\)/\1:/g' | sed 's/.$//' | awk '{print "fd"$1"::/48"}'
```

This gives you a prefix like:

```text
fd12:3456:789a::/48
```

This is not routable on the internet but is perfect for internal testing.

> For setting up IPv6 to IPv4 routing and translation, see my companion article on NAT64 and DNS64

---

## Step 2: Identify Your Infrastructure

Once you have your prefix, you need to know what you need to know. I am making the assumption that you, the reader, already know how to configure a device to have a static IP address, and only need to lay over existing knowledge.

Make a list of critical infrastructure: routers, switches, firewalls, DNS servers, DHCPv6 servers, monitoring systems, etc. Assign manual IPv6 addresses to each of these devices. This ensures deterministic addressing, helps with firewall rules, and avoids misconfigurations from autoconfiguration.

Use your prefix as the guide. If your prefix is `fd12:3456:789a::/48`, you might assign something like:

```text
fd12:3456:789a:1::1    # Core router
fd12:3456:789a:1::2    # DNS server
fd12:3456:789a:1::10   # Monitoring
fd12:3456:789a:1:dc1   # Domain Controller
fd12:3456:789a:1:aaaa  # A known problem device
```

Stick to /64 subnets and reserve a consistent numbering scheme. This pays dividends later during troubleshooting and expansion.

Because IPv6 allows letters, you can do fun things like "dc" for domain controller addresses, or "f" for file servers, or "aaaa" because it makes you scream every time you look at it.

---

## Step 3: DNS Entries Matter

These addresses are really long. **Really** long. AAAA records were made for IPv6 because the engineers of the past knew that every other person who would have to manage this in the future would scream out loud and tear their hair out.

But I am not the type to panic and give up.

Map your static addresses to some static DNS entries. Catalog them. You will need them later. Every router, every firewall, every network device can store DNS entries. Make DNS your friend, not your foe.

Also, while you're at it, give your IPv4 settings a quick look. Who knows what kinds of skeletons you'll find that turn out to be land mines avoided in the future.

---

## Sample Hosts File

This is a sample `hosts` file that works across both Windows and Linux systems. It maps common infrastructure to their corresponding IPv6 addresses. Adjust the names and addresses to match your actual environment.

```text
# /etc/hosts or C:\Windows\System32\drivers\etc\hosts

# Localhost
::1             localhost

# Infrastructure
fd12:3456:789a:1::1       router.local
fd12:3456:789a:1::2       dns.local
fd12:3456:789a:1::10      monitor.local
fd12:3456:789a:1:dc1      dc.local
fd12:3456:789a:1:aaaa     problemdevice.local
```

Use descriptive names, avoid overlap, and make sure you keep this file updated. You’ll thank yourself later when trying to ping a device without memorizing 39-character hex strings.

---

## Step 4: DHCP and Router Advertisements

DHCPv6 and router advertisements (RA) are the power couple of managed IPv6 networking. One doesn’t make much sense without the other in most practical environments. Individual devices will have their own special configuration and that is not what is addressed here. They all have this common capability.

Here’s the general outline:

- Use `radvd` or your router's built-in RA tool to announce your prefix and set flags for managed and/or other configuration.
- Enable a DHCPv6 server to hand out DNS servers, NTP settings, or other options.
- Make sure your RA and DHCPv6 configs don’t conflict — for example, don’t set `Autonomous` in RAs if you want DHCPv6 to manage addresses. What you really want is `Managed` or `Assisted` in this case because **YOU** are taking control here.
- Define a "small" segment for DHCP. For example, `fd12:3456:789a:1::12d:1 - fd12:3456:789a:1::12d:ffff`. This "small" part has the capacity for **65,535** simultaneous device connections. At this stage, you will never overrun your DHCP scopes in 99% of the scenarios you want it.

At this stage:

- Clients will get their addresses from RAs.
- Clients will get their DNS and other info from DHCPv6.

Keep logs, verify client behavior, and test failover if you're running high availability. I’ll explore the full config examples in a future article.
