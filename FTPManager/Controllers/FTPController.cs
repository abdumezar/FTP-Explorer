using FTPManagerProject.FTP;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FTPManagerProject.Controllers
{
    [AllowAnonymous]
    [Route("[controller]")]
    public class FTPController : Controller
    {
        [HttpGet]
        [HttpGet("Index")]
        public async Task<IActionResult> Index()
        {
            return View();
        }

        #region Connect
        [HttpPost("connect")]
        public async Task<IActionResult> Connect([FromForm] FTPUser account)
        {
            var check = FTPManager.Connect(account.Host, account.UserName, account.Password, HttpContext.Connection.Id);
            if (check)
            {
                Response.Cookies.Append("connectionId", HttpContext.Connection.Id, new CookieOptions()
                {
                    Expires = DateTime.Now.AddMinutes(45),
                    HttpOnly = true,
                    Secure = true
                });
                return Ok();
            }
            return BadRequest();
        }

        [HttpPost("reconnect")]
        public async Task<IActionResult> ReConnect()
        {
            if (Request.Cookies.ContainsKey("connectionId"))
            {
                var lastConnectionId = Request.Cookies["connectionId"];

                if (!string.IsNullOrEmpty(lastConnectionId))
                {
                    bool isExist = FTPManager.IsExist(lastConnectionId);

                    if (isExist)
                    {
                        var LastClient = FTPManager.FtpClient(lastConnectionId);
                        FTPManager.ReConnect(LastClient, HttpContext.Connection.Id);
                        Response.Cookies.Append("connectionId", HttpContext.Connection.Id, new CookieOptions()
                        {
                            Expires = DateTime.Now.AddMinutes(45),
                            HttpOnly = true,
                            Secure = true
                        });
                        return Ok();
                    }
                }
            }
            return NotFound();
        }

        #endregion

        #region Upload File
        [HttpPost("upload")]
        public async Task<ActionResult> Upload([FromForm] IList<IFormFile> files, [FromForm] string path = "", [FromForm] int replace = 0)
        {
            bool res;
            if (replace == 1)
            {
                var fileToReplace = path.Split("/").Last();
                var splitted = path.Split("/");
                path = string.Join("/", splitted.Take(splitted.Length - 1));
                res = await FTPManager.ReplaceFileAsync(files[0], path, fileToReplace, HttpContext.Connection.Id);
            }
            else
            {
                res = await FTPManager.UploadFilesAsync(files, path, HttpContext.Connection.Id);
            }

            return Ok(res ? "uploaded" : "faild");
        }
        #endregion

        #region Download File
        [HttpGet("download")]
        public async Task<ActionResult> Download(string path)
        {
            var status = FTPManager.DownloadFileAsync(path, out byte[] file, HttpContext.Connection.Id);
            if (status)
            {
                var base64 = Convert.ToBase64String(file);
                var contentType = FTPManager.GetContentType(path.Split("/").Last());
                return Json(new { base64, contentType });
            }
            return BadRequest();
        }
        #endregion

        #region List Files
        [HttpGet("show")]
        public async Task<IActionResult> Show(string path = "")
        {
            var files = await FTPManager.GetFilesAsync(path, HttpContext.Connection.Id);
            return Ok(files);
        }
        #endregion

        #region Delete File
        [HttpGet("delete")]
        public async Task<IActionResult> Delete(string path)
        {
            return Ok(await FTPManager.DeleteFileAsync(path, HttpContext.Connection.Id));
        }
        #endregion

        #region Replace File

        [HttpPost("replace")]
        public async Task<IActionResult> Replace([FromForm] IFormFile file, [FromForm] string path)
        {
            return Ok(await FTPManager.UploadFileAsync(file, path, HttpContext.Connection.Id));
        }

        #endregion
    }
}
