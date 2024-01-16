import os.path
import boto3
import string
import random
import sys



class File():
    def __init__(self,fileName) -> None:
        self.fileName = fileName
        pass

    def getFullPath(self):
        return os.path.join(os.path.dirname(os.path.abspath(os.path.dirname(__file__))), "cms")+'/'+self.fileName

    def getFileName(self):
        return self.fileName
    
class fileUploader():
    

    def __init__(self) -> None:

        self.file = File(sys.argv[1])

        print(self.file.fileName)
        print(self.file.getFullPath())
        print(sys.argv[2])
        print(sys.argv[3])
        self.uploadFiles()
        pass


    def randomKey(self):
        return ''.join(random.choices(string.ascii_lowercase + string.digits, k=7))

    def uploadFiles(self) -> None:
        path = self.file.getFullPath()
        s3_client = boto3.client(
            's3',
            aws_access_key_id=sys.argv[2],
            aws_secret_access_key=sys.argv[3]
        )

        print(sys.argv[2])
        print(sys.argv[3])
        
        s3_client.upload_file(path, sys.argv[4], sys.argv[5],ExtraArgs={'ContentType': sys.argv[6], 'ACL': "public-read"} )
        os.remove(path)



i = fileUploader()
