---
title: 【深度学习】基于Pytorch的CNN网络对CIFAR10数据集进行分类
date: 2023-12-28 23:25:57
lang: zh
summary:
---
一、配置环境

首先安装Anaconda创建Python虚拟环境，然后配置Pytorch环境（Pytorch是一个深度学习框架），然后可以在VScode中编写、调试、运行Pytorch相关代码。

1.安装Anaconda，详见下面链接：

[python - 手把手教你如何在 Windows 安装 Anaconda - 个人文章 - SegmentFault 思否](https://segmentfault.com/a/1190000037752539)

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231226221229-1024x627.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231226221229.png)

2.Pytorch环境配置：

在Anaconda里面创建一个虚拟环境来安装Pytorch，打开Anaconda Navigator（这是图形化的操作页面），在Environments的界面选择新建一个环境。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231226221553-1024x627.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231226221553.png)

创建完成之后，到Pytorch的官网找安装的命令。

[PyTorch](https://pytorch.org/)

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231226222140-1024x704.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231226222140.png)

直接复制命令行代码即可。之后打开之前Pytorch目录下的终端，添加清华镜像，不然很有可能出现网络断开崩掉的情况。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231226222144-1024x627.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231226222144.png)

复制下面代码到终端里，添加清华镜像，不然下载Pytorch可能会失败。

```text
conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/free/

conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/main/

conda config --set show_channel_urls yes

conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud/pytorch/
```

复制之前在Pytorch官网的安装代码，回车,弹出提示，选择Y安装即可。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231226222147-1024x576.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231226222147.png)

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231226225619-1024x576.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231226225619.png)

安装成功验证：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231227150636-1024x144.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231227150636.png)

在虚拟环境中，输入命令python，接着输入命令import torch，接着输入命令torch.cuda.is_available()，显示为Ture，说明安装成功。

3.VScode中配置pytorch：

vscode中配置json，打开Vscode，左上角点击文件>>首选项>>设置>>扩展，在扩展中找到python，点击右侧：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231227151125-1024x655.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231227151125.png)

找到虚拟环境中的python.exe的路径并设置：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231227151703-1024x256.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231227151703.png)

设置好后，快捷键方式Ctrl+Shift+P打开命令面板。

然后选择Python解释器：Python: Select Interpreter；选择希望使用的Python解释器即可：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231227153734-1.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231227153734-1.png)

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231227153358-1024x655.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231227153358.png)

运行成功则设置成功。

然后在vscode的终端中进入pytorch环境：

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231227173130-1024x473.jpg)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231227173130-scaled.jpg)

点击输入pytorch对应路径：

```text
D:\download\Anaconda\Scripts\activate.bat D:\download\Anaconda\envs\Pytorch
```

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231227173235.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231227173235.png)

成功进入后可以按F5直接进行调试运行文件，若缺少相关的包在命令行中输入进行下载即可：

```text
pip install 缺失的包名
```

二、代码与结果

1.数据准备： 使用torchvision加载了CIFAR-10数据集，并设置了相应的训练和测试数据加载器。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231228150408.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231228150408.png)

2.神经网络构建： 定义了一个包含卷积层、池化层和全连接层的神经网络模型。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231228150433.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231228150433.png)

3.模型训练： 使用SGD优化器，在训练数据上进行了30个周期的训练。每个周期内，对训练数据进行迭代，进行前向传播、损失计算、反向传播和参数更新，并打印训练集损失值和准确率。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231228150449-1.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231228150449-1.png)

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231228150525-1024x636.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231228150525.png)

4.模型评估： 在测试数据集上对训练好的模型进行评估。计算测试集上的损失值、准确率，并使用precision_recall_fscore_support函数计算每个类别的精确度（precision）、召回率（recall）和F1分数，并计算其平均值。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231228150540.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231228150540.png)

5.TensorBoard 可视化： 使用SummaryWriter记录了训练和测试集的损失和准确率等指标，以便进行可视化分析。

6.模型保存： 每个周期结束后，将模型的状态字典保存到指定路径。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231228150607-1-1024x429.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231228150607-1.png)

完整源代码：

```text
import torch
import torchvision
from torch import nn
from torch.utils.data import DataLoader
from torch.utils.tensorboard import SummaryWriter
from sklearn.metrics import precision_recall_fscore_support

# 数据集准备
train_data = torchvision.datasets.CIFAR10(root='../data', train=True,
                                 transform=torchvision.transforms.ToTensor(), download=True)
test_data = torchvision.datasets.CIFAR10(root='../data', train=False,
                                 transform=torchvision.transforms.ToTensor(), download=True)

#批量加载数据
train_dataloader = DataLoader(train_data, batch_size=64, shuffle=True)
test_dataloader = DataLoader(test_data, batch_size=64, shuffle=False)

# 神经网络
class Model(nn.Module):
    def __init__(self):
        super(Model, self).__init__()
        self.model = nn.Sequential(
            nn.Conv2d(3, 32, 5, 1, 2),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 32, 5, 1, 2),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 5, 1, 2),
            nn.MaxPool2d(2),
            nn.Flatten(),
            nn.Linear(64 * 4 * 4, 64),
            nn.Linear(64, 10),
        )

    def forward(self, x):
        x = self.model(x)
        return x

# 创建神经网络模型对象，将模型移至GPU
model = Model().cuda()

# 创建TensorBoard可视化
writer = SummaryWriter('../logs_tensorboard')

# 定义损失函数和优化器
loss = nn.CrossEntropyLoss().cuda()
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)

for epoch in range(30):
    print('开始第{}轮训练'.format(epoch + 1))
    #设置模型为训练模式
    model.train()
    sum_loss = 0
    num_correct = 0

    for batch_idx, (imgs, targets) in enumerate(train_dataloader):
        imgs = imgs.cuda()
        targets = targets.cuda()

        output = model(imgs)
        loss_in = loss(output, targets) #利用损失函数进行计算

        optimizer.zero_grad()
        loss_in.backward()
        optimizer.step()

        sum_loss += loss_in.item() #累积损失值
        num_correct += (output.argmax(1) == targets).sum().item() # 累积正确预测数量

        if (batch_idx + 1) % 100 == 0:
            writer.add_scalar('Train/loss', loss_in.item(), epoch * len(train_dataloader) + batch_idx + 1)

    avg_loss = sum_loss / len(train_dataloader.dataset)
    accuracy = 100. * num_correct / len(train_dataloader.dataset)
    print('第{}轮训练集损失值：{:.4f}'.format(epoch + 1, avg_loss))
    print('第{}轮训练集正确率：{:.2f}%'.format(epoch + 1, accuracy))

    sum_loss = 0
    accurate = 0
    # 设置模型为评估模式
    model.eval()

    with torch.no_grad():
        all_predictions = []
        all_targets = []

        for batch_idx, (imgs, targets) in enumerate(test_dataloader):
            imgs = imgs.cuda()
            targets = targets.cuda()

            output = model(imgs)
            _, predicted = output.max(1) #获取模型输出的预测类别
            all_predictions.extend(predicted.cpu().numpy()) # 将预测结果添加到列表中
            all_targets.extend(targets.cpu().numpy()) # 将真实标签添加到列表中

            loss_in = loss(output, targets)
            sum_loss += loss_in.item()
            accurate += (predicted == targets).sum().item()

    avg_loss = sum_loss / len(test_dataloader.dataset)
    accuracy = 100. * accurate / len(test_dataloader.dataset)
    print('第{}轮测试集损失值：{:.4f}'.format(epoch + 1, avg_loss))
    print('第{}轮测试集正确率：{:.2f}%'.format(epoch + 1, accuracy))

    # 计算每个类别的 precision、recall 和 F1-score以及平均值
    precision, recall, f1, _ = precision_recall_fscore_support(all_targets, all_predictions, average=None)
    avg_precision, avg_recall, avg_f1, _ = precision_recall_fscore_support(all_targets, all_predictions, average='macro')

    # 打印每个类别的指标
    for i in range(10):
        print(f'Class {i} - Precision: {precision[i]:.4f}, Recall: {recall[i]:.4f}, F1-score: {f1[i]:.4f}')

    #打印平均值
    print(f'Average Precision: {avg_precision:.4f}, Average Recall: {avg_recall:.4f}, Average F1-score: {avg_f1:.4f}')

    writer.add_scalar('Test/loss', avg_loss, epoch + 1)
    writer.add_scalar('Test/accuracy', accuracy, epoch + 1)

    torch.save(model.state_dict(), f'd:/Users/asus/Desktop/机器学习/保存目录/5/model_{epoch + 1}.pth')
    print(f"第{epoch + 1}轮模型训练数据已保存")

writer.close()
```

最终测试集正确率在经过30轮训练后基本能达到60~75%之间，测试几次都在这个范围区间内。
下图为最后一轮训练的所得结果。

[![](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231228134156.png)](https://haotlas.cn/wp-content/uploads/2023/12/QQ图片20231228134156.png)

参考链接：

[VScode+Anaconda+Pytorch环境搭建指南（超详细）_anaconda+vscode最详细教程-CSDN博客](https://blog.csdn.net/weixin_43762840/article/details/121721264?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522170359786516800192293679%2522%252C%2522scm%2522%253A%252220140713.130102334.pc%255Fall.%2522%257D&request_id=170359786516800192293679&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~first_rank_ecpm_v1~rank_v31_ecpm-2-121721264-null-null.142^v98^pc_search_result_base4&utm_term=vscode%E5%A6%82%E4%BD%95%E9%85%8D%E7%BD%AEtorchvision%E5%92%8Cpytorch%E5%BA%93&spm=1018.2226.3001.4187)

[Win10+Anaconda+Pytorch_CPU+VsCode安装配置_anaconda pytorch vscode-CSDN博客](https://blog.csdn.net/CZZ_CS/article/details/130137922?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522170366012116800226527063%2522%252C%2522scm%2522%253A%252220140713.130102334.pc%255Fall.%2522%257D&request_id=170366012116800226527063&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~first_rank_ecpm_v1~rank_v31_ecpm-4-130137922-null-null.142^v98^pc_search_result_base4&utm_term=%E5%9C%A8%E6%88%91%E5%AE%8C%E6%88%90%E4%BA%86anaconda%E7%9A%84pytorch%E7%8E%AF%E5%A2%83%E9%85%8D%E7%BD%AE%E5%90%8E%EF%BC%8C%E6%88%91%E8%AF%A5%E5%A6%82%E4%BD%95%E5%9C%A8vscode%E4%B8%AD%E4%BD%BF%E7%94%A8&spm=1018.2226.3001.4187)

[Pytorch---- CIFAR10实战(训练集+测试集+验证集)完整版，逐行注释-----学习笔记_pytorch 如何生成训练集,验证集和测试集-CSDN博客](https://blog.csdn.net/qq_38737428/article/details/121931464?spm=1001.2014.3001.5506)

数据集下载链接：

[CIFAR-10 and CIFAR-100 datasets (toronto.edu)](https://www.cs.toronto.edu/~kriz/cifar.html)