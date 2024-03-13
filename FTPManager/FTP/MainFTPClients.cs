using FluentFTP;

namespace FTPManagerProject.FTP
{
    public class MyFTPClient
    {
        public FtpClient Client { get; set; }
        public DateTime LastRequestTime { get; set; } = DateTime.Now;
    }
}
