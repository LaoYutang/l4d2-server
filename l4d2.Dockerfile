FROM centos:7

EXPOSE 27015
EXPOSE 27015/udp

# 环境准备
COPY ./Centos-7.repo /etc/yum.repos.d/CentOS-Base.repo
RUN yum install glibc libstdc++ glibc.i686 libstdc++.i686 wget vim libcurl -y
RUN mkdir -p /l4d2 /root/steamcmd

# 安装steamcmd并下载l4d2
WORKDIR /root/steamcmd
COPY ./steamcmd_linux.tar.gz .
RUN tar -zxvf steamcmd_linux.tar.gz
RUN ./steamcmd.sh +@sSteamCmdForcePlatformType windows +force_install_dir /l4d2 +login anonymous +app_update 222860 validate +quit
RUN ./steamcmd.sh +@sSteamCmdForcePlatformType linux +force_install_dir /l4d2 +login anonymous +app_update 222860 validate +quit

# 复制插件包
COPY ./cauldron/left4dead2/ /l4d2/left4dead2
COPY /l4d2/left4dead2/ /l4d2-backup/left4dead2/

# 复制启动脚本
COPY ./start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]