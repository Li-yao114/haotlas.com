---
title: 解决wordpress上传主题/插件时报错：您点击的链接已过期，请重试。
date: 2023-12-13 22:23:34
lang: zh
summary: 解决wordpress上传主题-插件时报错：您点击的链接已过期
---
参考相关链接：

[如何修复“您关注的链接已过期”WordPress 错误 - WPRBS](https://www.wprbs.com/zh-CN/how-to-fix-the-link-you-followed-has-expired-wordpress-error.html)

[如何修改WordPress最大上传文件大小限制 - 闪电博 (wbolt.com)](https://www.wbolt.com/how-to-increase-the-max-upload-size-in-wp.html)

[如何修复 WordPress 中的 "你跟踪的链接已过期" 错误 - WPYOUCAN](https://www.wpyoucan.com/tutorial/how-to-fix-the-link-you-followed-has-expired-error-in-wordpress/)

emmmmmm，在我想要更换网站主题并且在GitHub上找到了两个极简主题的zip文件，然后准备上传看看效果时：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173850-1024x287.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173850.png)

显示如下：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173710.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173710.png)

然后我查找相关资料，估计是网络主机将具有已定义的最大文件上传大小限制。当主题或插件的文件大小超过默认上传和执行限制时，就可能会遇到链接过期错误。然后我就跟着这些方法操作想要更正：

我在上传媒体文件这看到了最大上传文件大小：1MB，我就大大肯定了自己当前做法的正确性（实际上是错的）。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173713.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173713.png)

以下方法理论上任意一种都可解决问题，如果不行，那就多尝试几种方法吧。

首先三种比较直接的方法是：

1.下载插件WPCode增加限制：

激活插件后，只需进入代码片段 > 添加片段，然后点击 “添加自定义代码”：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173716-1024x640.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173716.png)

确保从 “代码类型” 下拉菜单中选择 “PHP 代码段”，然后在” 代码预览 “框中输入该代码。

```text
@ini_set('upload_max_size', '120M).
@ini_set('post_max_size', '120M').
@ini_set('max_execution_time', '300).
```

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173719-1024x598.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173719.png)

max_execution_time、upload_max_size 和 post_max_size 的值根据实际情况进行设置。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173722-1024x258.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173722.png)

保存后激活即可。

2.在 functions.php 文件中增加限制：

这种方法比较简单，但也有缺点。如果更改 WordPress 主题，网站将恢复到旧限制。代码如下：

```text
@ini_set('upload_max_size', '120M);
@ini_set('post_max_size', '120M');
@ini_set('max_execution_time', '300);
```

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173725-1024x787.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173725.png)

3.依旧是利用插件，既然核心是上传的大小限制，那就利用能提高上传大小限制的插件，比如下面这个：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173744.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173744.png)

虽然能提升上传文件大小的上限，但对存在的问题没有什么帮助，聊胜于无吧，好歹上传可以没限制了......

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173750.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173750.png)

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173748.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173748.png)

在完成一些操作后没啥反应，我寻思是不是由于某些缓存问题使更新不及时，于是我用如下插件清理缓存：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173736.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173736.png)

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173739-1024x240.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173739.png)

然后我就发现没有任何暖用。

然后我看主流的三种比较麻烦的做法是（以下三种任意一种方法都可解决问题）：

1.修改.htaccess文件：

首先我不太清楚“.htaccess”文件在什么目录下，于是使用如下命令查找：

```text
sudo find / -type f -name ".htaccess"
```

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173727.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173727.png)

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173731.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173731.png)

在合适的位置添加下列代码：

```text
php_value upload_max_filesize 120M
php_value post_max_size 120M
php_value max_execution_time 300
php_value max_input_time 300
```

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173734.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173734.png)

保存更改后会上传到网站。

2.创建或修改 “php.ini” 文件：

首先查找php.ini文件的位置：

```text
sudo find / -type f -name ".htaccess"
```

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173756-1024x773.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173756.png)

添加以下代码：

```text
upload_max_filesize = 128M
post_max_size = 128M
max_execution_time = 300
```

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173759.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213173759.png)

保存更改后会上传到网站。

3.创建或修改 “.user.ini” 文件：

如果服务器托管服务提供商已锁定了全局PHP设置，则他们可能已将服务器配置为使用.user.ini文件而不是php.ini文件。与php.ini和.htaccess文件一样，可以在网站的根目录中找到.user.ini。如果找不到，则可以在同一位置创建一个新的.user.ini文件。按照前面方法中描述的相同过程创建一个新的 php.ini文件。

接下来，将以下代码添加到.user.ini文件中：

```text
upload_max_filesize = 32M
post_max_size = 64M
memory_limit = 128M
```

只是重复了前面的方法，只是文件名不同。

最后实际上解决了我的问题的做法是：

在appnode里对我的网站进行设置，更改PHP中的上传文件大小限制即可：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213221829.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213221829.png)


[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213222225.jpg)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231213222225.jpg)

是时候找个时间给wordpress换了，具体多久、替换成什么、有什么效果，那就敬请期待吧！