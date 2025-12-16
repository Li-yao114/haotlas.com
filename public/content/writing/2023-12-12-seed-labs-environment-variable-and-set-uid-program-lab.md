---
title: SEED Labs—Environment Variable and Set-UID Program Lab 
date: 2023-12-12 22:40:00
lang: zh
summary: 
---
相关链接：

- Lab 网址：[https://seedsecuritylabs.org/Labs_20.04/Software/Environment_Variable_and_SetUID/](https://seedsecuritylabs.org/Labs_20.04/Software/Environment_Variable_and_SetUID/)

- 任务书：[https://seedsecuritylabs.org/Labs_20.04/Files/Environment_Variable_and_SetUID/Environment_Variable_and_SetUID.pdf](https://seedsecuritylabs.org/Labs_20.04/Files/Environment_Variable_and_SetUID/Environment_Variable_and_SetUID.pdf)

- VM 手册：[https://github.com/seed-labs/seed-labs/blob/master/manuals/vm/seedvm-manual.md](https://github.com/seed-labs/seed-labs/blob/master/manuals/vm/seedvm-manual.md)

Task 1：

1.使用printenv指令打印出环境变量：

![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009112852.png)

![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009112916-1024x628.png)

使用printenv PWD打印出特定的环境变量：

![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009113335.png)

2.使用env指令打印出环境变量：

![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009113155.png)

![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009113202-1024x629.png)

使用env |grep PWD打印出特定的环境变量：

![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009113529.png)

3.使用export和unset设置或取消设置环境变量：

先通过export添加环境变量，然后通过unset命令删除环境变量：

1）export添加环境变量tmp_env=123：

![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009121548.png)

2）unset删除环境变量tmp_env=123：

![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009121551.png)

由上可知，可以利用export和unset命令成功完成添加和删除环境变量操作，并利用printenv指令进行筛选并打印出添加的环境变量。

Task 2：

step1：

编译并运行下面程序，并将编译生成的二进制文件a.out输出到myprintenv.txt文件中：

![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009122245.png)

![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009122857.png)

![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009122903-1024x546.png)

step2：

注释掉子进程的printenv，执行父进程的printenv，再次编译并运行，将结果保存到myprintenv2.txt中：

![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009123433.png)

![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009123830.png)

![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009123838.png)

step3：

比较二者的不同，使用的是diff命令比较两个输出文件的不同。

![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009124052.png)

![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009124405-1024x413.png)

![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009124407-1024x382.png)

由上可以看到，子进程继承了父进程的全部环境变量。

结论：diff命令执行后提示在48c48是在第一个文件的48行与第二个文件的48行处有所不同，后表示的是第二个文件中48行处的内容。可以看出，子进程与父进程相比，继承了父进程的环境变量。唯一的不同是可执行程序的用户名不同而已。

Task 3：

step1：

编译并运行下面程序：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009124932.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009124932.png)

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009125107.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009125107.png)

成功运行，但在terminal中没有执行结果打印出来，因为此时由于execve函数中传递的环境变量为NULL，所以没有输出值。

step2：

将程序中的exexve（"/usr/bin/env", argv, NULL）换成 execve("/usr/bin/env", argv, environ)，即在第三个参数位置传入environ（全局环境变量）。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009125549.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009125549.png)

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009125729-1024x686.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009125729.png)

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009125734-1024x489.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009125734.png)

修改execve()函数的参数NULL之后，可以成功编译并执行，并打印出了当前的环境变量。

step3：

综上两步可以得出结论，第一次实验中，发现没有打印出环境变量，这是因为在执行execve()函数时，传递了一个NULL的参数，所以并不会打印出结果。当把NULL替换成了全局环境变量environ时候，便可以成功将传递进去的环境变量打印出来。

Task 4：

编译并运行以下程序来验证使用system（），调用进程的环境变量被传递给新程序/bin/sh

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009131311.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009131311.png)

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009131504-1024x663.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009131504.png)

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009131509-1024x558.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009131509.png)

结论：查阅资料后得知，system()函数实质是使用execl()函数利用fork()生成的子进程调用了/bin/sh，然后通过/bin/sh来在shell中执行，这个过程中execl()是调用了execve()函数，当在system中传入参数/usr/bin/env之后，即相当于将环境变量传入了execve()函数，因此，system()函数可以成功执行打印了环境变量。

Task 5：

step1：

创建task5.c文件，并写入如下代码依次打印当前进程的环境变量：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009132013.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009132013.png)

step2：

编译该程序，在执行step2中指令前，先查看一下程序的用户以及模式：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009183032.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009183032.png)

更改task5的有效用户为root，以及设置了Set_UID的比特位，再次查看task5文件的权限，对比在更改之前的权限。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009183254.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009183254.png)

step3：

未修改之前，运行程序并查看当前环境变量：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009191702-1024x672.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009191702.png)

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009191707-1024x285.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009191707.png)

执行step3中的步骤，执行export命令，路径为/home/seed/，其中，自定义的环境变量命名为EXTRA_PATH：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009192436-1024x183.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009192436.png)

执行之后，过滤其中含有PATH的路径，可以看到，其中PATH以及自定义的环境变量EXTRA_PATH均成功执行，但是LD_LIBRARY_PATH的环境变量并没有显示出来。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009192628-1024x157.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009192628.png)

对LD_LIBRARY_PATH的环境变量单独过滤：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009192747.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009192747.png)

依然是没有成功显示出来，后续了解后得知。这是因为动态链接器的保护机制，设置LD_LIBRARY_PATH环境变量其实就是设置动态库的查找路径，而这是不会出现在子进程的环境变量中的，所以子进程是看不到的。
根据动态链接库的防御机制，在编译后设置了该程序的有效ID为root，而在普通用户shell中运行时，真实用户为seed，因此此处设置的环境变量被忽略，没有起作用。
但是当直接在shell中打印该环境变量，能够成功打印：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009192847.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009192847.png)

Task 6：

需要运行程序如下：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009193335.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009193335.png)

由指导书可知：此处需要将/bin/sh链接到/bin/zsh即可正常进行。

在Ubuntu 20.04（以及之前的几个版本）中，/bin/sh实际上是指向/bin/dash的符号链接。这个shell程序有一个防止自己在Set-UID进程中执行的基本上，如果dash检测到它是在Set-UID进程中执行的，它会立即将有效的用户ID更改为该进程由于我们的受害程序是一个Set-UID程序，因此/bin/dash中的对策可以防止我们的攻击。要查看在没有这样的对策的情况下我们的攻击是如何工作的，我们将/bin/sh链接到另一个没有这样的对策的shell我们在Ubuntu中安装了一个名为zsh的shell程序20.04 VM。

查看/bin目录下的sh程序文件：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009201250.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009201250.png)

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009201252.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009201252.png)

将/bin/sh软链接到 /bin/zsh：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009202354-1.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009202354-1.png)

在未设置Set_UID程序之前，正常执行ls命令：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009202415-1.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009202415-1.png)

将task6设置为root用户下的Set_UID程序：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009202544.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009202544.png)

查看/bin文件下的pwd命令，对ls命令的使用转换到对pwd命令上：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009202636.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009202636.png)

将/bin/pwd命令程序复制到/home/seed/Desktop/Labsetup目录下，并命名为ls
修改PATH环境变量，将/home/seed/Desktop/Labsetup加入到PATH环境变量的开头，因此在执行命令时候，会优先到/home/seed/Desktop/Labsetup目录下寻找。
在task6.c程序中，执行system（“ls”）命令，其中ls将会直接去/home/seed/Desktop/Labsetup目录中查找。而我们已经把pwd程序复制到该目录下的ls程序中，因此执行task6时，程序相当于执行了一次pwd操作。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009203011-1024x152.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009203011.png)

运行task6程序：可以看到，并没有执行ls命令的效果，但是执行了pwd命令的效果，程序运行了指定的shell程序/bin/sh。由于task6为Set_UID程序，有效用户为root，显然在执行过程中是以root权限执行了。
此处实现了用Set_UID程序来运行自己代码的效果。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009203014.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009203014.png)

Task 7：

step1：

1.编辑mylib.c程序如下：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009203554.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009203554.png)

2.将mylib.c编译为libmylib.so.1.0.1动态链接库：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009203811-1024x104.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009203811.png)

3.设置LD PRELOAD环境变量：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009203927.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009203927.png)

4.编辑并编译myprog.c程序，如下：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009204346.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009204346.png)

step2：

1.regular program & normal user.

短时间内直接打印输出结果，说明sleep函数与自定义的动态链接库链接到了一起。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009204607-1.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009204607-1.png)

2.Set-UID root program & normal user.

将myprog程序的owner有效使用者改为root，设置为Set_UID程序，可以实现Set_UID root程序，普通用户的环境。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009205021.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009205021.png)

重新运行程序，此时，程序运行大概1s之后结束，但是没有任何输出结果。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009205024.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009205024.png)

3.Set-UID root program & export LD PRELOAD env & root account

先将用户权限提升至root用户，再增加LD_PRELOAD的环境变量，查看环境变量可以看到设置成功：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009205331.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009205331.png)

此时运行myprog程序，程序没有等待1s时间，直接打印出结果：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009205349.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009205349.png)

4.Set-UID user1 program & different user & export LD PRELOAD env

之前的Set_UID程序为user1，此时将user2设置为haotlas，在此用户下运行
尝试为myprog更改用户haotlas，直接更改出错，因此在系统中考虑新建一个用户。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009210758.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009210758.png)

使用sudo adduser haotlas命令：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009205655.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009205655.png)

切换到haotlas用户，可以看到myprog的有效用户依然是root，此处需要将其调整为user2即haotlas，即直接使用chown命令即可。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009210118.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009210118.png)

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009210315.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009210315.png)

运行程序发现，等待1s之后没有任何输出结果：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009211136.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009211136.png)

step3

分析，查阅资料后了解到LD_PRELOAD变量的保护策略，是通过链接。使用gcc的-static参数可以把libc.so.6静态链入执行程序中。但这也就意味着程序不再支持动态链接。通过设置执行文件的setgid /setuid标志，在有Set-UID权限的执行文件，系统会忽略LD_PRELOAD环境变量。也就是说，如果你有以root方式运行的程序，最好设置上SUID权限.如：chmod 4755 myprog
分析：
1中，有效用户和真实用户均为seed，因此并没有忽略自定义的环境变量LD_PRELOAD，此时链接到的是自定义的动态链接库，ibmylib.so.1.0.1，输出打印结果。
2中，有效用户为root，真实用户为seed，真实用户与有效用户不同。此时环境变量LD_PRELOAD就被屏蔽（这正是动态链接器的防御机制），链接到的是原先的标准库libc，此时执行了sleep（）没有输出。
3中，有效用户和真实用户均为root，因此并没有忽略自定义的环境变量LD_PRELOAD，保护机制没有生效。此时链接到的是自定义的动态链接库，ibmylib.so.1.0.1，输出打印结果。
4中，有效用户为haotlas，真实用户为seed，真实用户与有效用户不同。此时环境变量LD_PRELOAD就被屏蔽，链接到的就不是自定义的动态链接库，而是原先的标准库，此时执行了sleep（）没有输出。

Task 8：

step1：

catall.c文件如下：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009211459.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009211459.png)

对catall.c程序编译后，将其有效用户设置为root，并设置为Set_UID程序。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009211645.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009211645.png)

运行catall.c程序，可以看到能够成功执行，将所需求的文件task8.c的内容打印出来。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009211730.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009211730.png)

在root用户情况下，在根目录下新建一个test.txt文件，此文件的所有者是root，只有root有对该文件的执行修改权限。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009215040.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009215040.png)

注意：此处必须是根目录，经实验，当在其他目录下时，即使切换到普通用户情况下，依旧可以删除。
在seed用户情况下，查看该test.txt文件、查看文件权限、删除文件这些操作都是被禁止的。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009215316.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009215316.png)

在查阅相关资料后找到如下办法：

只需在filename的位置（catall.c）后面接上该指令即可，如下：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009215624.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009215624.png)

此时，切换到root用户下，查看test.txt文件，可以看到无此文件，即删除成功。在catall.c的辅助下是可以删除一个不可写的文件的。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009223733.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009223733.png)

step2：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009222652.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009222652.png)

对catall.c程序重新运行执行，并改变其有效用户，设置catall为Set_UID程序。运行该程序，发现是可以正常执行的。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009223445.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009223445.png)

切换到root用户下，新建测试文件test2.txt，并将其置于根目录下。查看其属性，可以看到，普通用户只有可读权限。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009223733-1.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009223733-1.png)

采用Step1中的方法删除该文件，发现是无法成功删除的，显示没有该文件或目录。

分析原因：

在system（）函数中，本质上是调用shell去执行命令，此时shell独立性是比较高的，会将其分为两条命令分开执行。没有区分代码和数据。

而execve（）函数中，本质上就是执行命令，此时只能执行一个进程，当作一个命令执行，这是删除失败的原因。实现了代码和数据的相隔离。

Task 9：

创建/etc/zzz文件：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231010000210.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231010000210.png)

cap_leak.c程序及其编译过程：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009224544.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009224544.png)

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009224849.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231009224849.png)

为cap_leak赋予root有效用户以及设置为Set_UID程序：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231010000552.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231010000552.png)

运行cap_leak程序，再手动输入内容：* hack *之后，退出程序。
查看/etc/zzz文件的内容，发现已经被篡改。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231010000554.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231010000554.png)

分析原因：
该程序是root有效用户，并是Set_UID程序，有权利打开/etc/zzz文件，在执行了setuid()撤销权限后，由于文件并没有关闭，出现了权限泄露的问题，该文件仍然具有root权限。因此能够继续执行写入的内容。

（完）