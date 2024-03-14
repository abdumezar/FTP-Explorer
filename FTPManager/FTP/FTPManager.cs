using FluentFTP;
using System.Collections;

namespace FTPManagerProject.FTP
{
    public static class FTPManager
    {
        private static readonly Hashtable clients = new Hashtable();

        #region Auto Deletion & Disconnection
        private static readonly object syncLock = new object();
        private static readonly Timer cleanupTimer = new(CleanupExpiredClients, null, TimeSpan.Zero, TimeSpan.FromHours(6));

        private static void CleanupExpiredClients(object state)
        {
            if (clients.Count == 0)
                return;

            lock (syncLock)
            {
                foreach (DictionaryEntry entry in clients)
                {
                    var ftpClient = (MyFTPClient)entry.Value;
                    if (DateTime.Now - ftpClient.LastRequestTime > TimeSpan.FromMinutes(30))
                    {
                        ftpClient.Client.Disconnect();
                        clients.Remove(entry.Key);
                    }
                }
            }
        }
        #endregion

        #region Manage the Connection
        public static bool Connect(string host, string username, string password, string ConnectionId)
        {
            if (IsExist(ConnectionId)) Disconnect(ConnectionId);
            var client = new FtpClient(host, username, password, 21);
            client.Connect();
            bool check = client.IsConnected;
            if (check)
            {
                clients.Add(ConnectionId, new MyFTPClient()
                {
                    Client = client
                });
            }
            return check;
        }

        public static void ReConnect(FtpClient ftpClient, string ConnectionId)
        {
            if (!ftpClient.IsConnected) ftpClient.Connect();
            if (!IsExist(ConnectionId))
            {
                clients.Add(ConnectionId, new MyFTPClient()
                {
                    Client = ftpClient
                });
            }
        }

        public static void Disconnect(string ConnectionId)
        {
            if (IsExist(ConnectionId))
            {
                var client = (MyFTPClient?)clients[ConnectionId];
                if (client is not null && client.Client.IsConnected) client.Client.Disconnect();
                clients.Remove(ConnectionId);
            }
        }

        public static bool IsExist(string ConnectionId)
        {
            return clients.ContainsKey(ConnectionId);
        }

        public static FtpClient? FtpClient(string ConnectionId)
        {
            if (IsExist(ConnectionId))
            {
                var myClient = (MyFTPClient?)clients[ConnectionId];
                if (myClient is null) return null;
                if ((DateTime.Now - myClient.LastRequestTime).TotalMinutes > 30)
                {
                    Disconnect(ConnectionId);
                    return null;
                }
                myClient.LastRequestTime = DateTime.Now;
                if (!myClient.Client.IsConnected) myClient.Client.Connect();
                return myClient.Client;
            }
            return null;
        }
        #endregion

        #region Upload Files
        public static async Task<bool> UploadFileAsync(IFormFile file, string path, string ConnectionId)
        {
            try
            {
                var client = FtpClient(ConnectionId);
                client.UploadStream(file.OpenReadStream(), Path.Combine(path, file.FileName));
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public static async Task<bool> UploadFilesAsync(IList<IFormFile> files, string path, string ConnectionId)
        {
            try
            {
                foreach (var file in files)
                {
                    var client = FtpClient(ConnectionId);
                    client.UploadStream(file.OpenReadStream(), Path.Combine(path, file.FileName));
                }
                return true;
            }
            catch (Exception)
            {
                return false;
            }

        }
        #endregion

        #region Replace Files
        public static async Task<bool> ReplaceFileAsync(IFormFile file, string path, string nameToReplace, string ConnectionId)
        {
            try
            {
                var client = FtpClient(ConnectionId);
                client.UploadStream(file.OpenReadStream(), Path.Combine(path, nameToReplace));
                client.Disconnect();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        #endregion

        #region List Files
        public static async Task<List<FileItem>> GetFilesAsync(string path, string ConnectionId)
        {
            try
            {
                var client = FtpClient(ConnectionId);
                var files = client.GetListing(path, FtpListOption.IncludeSelfAndParent);
                var returnedFiles = files.Select(f => new FileItem { LastModified = f.Modified.ToString(), Name = f.Name, Path = f.FullName, Type = f.Type, Size = f.Size.ToString() }).ToList();
                returnedFiles = returnedFiles.OrderByDescending(F => F.Type).ThenBy(F => F.Name).ToList();
                returnedFiles.ForEach(F => F.Size = (long.Parse(F.Size) / 1024) == 0 ? "<1 KB" : (long.Parse(F.Size) / 1024) + " KB");
                return returnedFiles;
            }
            catch (Exception)
            {
                return new List<FileItem>();
            }
        }

        public class FileItem
        {
            public string Name { get; set; }
            public string Path { get; set; }
            public string Size { get; set; }
            public string LastModified { get; set; }
            public FtpObjectType Type { get; set; }
        }

        #endregion

        #region Delete Files
        public static async Task<bool> DeleteFileAsync(string path, string ConnectionId)
        {
            try
            {
                var client = FtpClient(ConnectionId);
                client.DeleteFile(path);
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }
        #endregion

        #region Download File
        public static bool DownloadFileAsync(string path, out byte[]? file, string ConnectionId)
        {
            try
            {
                var client = FtpClient(ConnectionId);
                bool res = client.DownloadBytes(out file, path);
                return res;
            }
            catch (Exception)
            {
                file = null;
                return false;
            }
        }
        #endregion

        #region Get Content Type
        public static string GetContentType(string fileName)
        {
            switch (Path.GetExtension(fileName).ToLower())
            {
                case ".pdf":
                    return "application/pdf";
                case ".doc":
                    return "application/msword";
                case ".docx":
                    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                case ".xls":
                    return "application/vnd.ms-excel";
                case ".xlsx":
                    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                case ".png":
                    return "image/png";
                case ".jpg":
                case ".jpeg":
                    return "image/jpeg";
                default:
                    return "application/octet-stream";
            }
        }
        #endregion
    }

    public class FTPUser
    {
        public string Host { get; set; }
        public int Port { get; set; } = 21;
        public string UserName { get; set; }
        public string Password { get; set; }
    }
}
