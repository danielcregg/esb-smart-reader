import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Filesystem, Directory } from '@capacitor/filesystem';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  constructor(private httpClient: HttpClient) {}

  async downloadHDF() {
    // Login to ESB Networks website
    interface LoginResponse {
      accessToken: string;
    }

    const loginResponse = await this.httpClient.post('https://www.esbnetworks.ie/login', {
      username: 'daniel.cregg@gmail.com',
      password: 'ygpSV25bPYM9kN!',
    }).toPromise() as LoginResponse;

    // Get the HDF file URL
    const accessToken = loginResponse.accessToken;

    const hdfFileUrlResponse = await this.httpClient.get<string>('https://www.esbnetworks.ie/my-smart-data/download-hdf-file', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      responseType: 'json' // Change this to 'json'
    }).toPromise();

    // Download the HDF file
    const hdfFileResponse = await this.httpClient.get(hdfFileUrlResponse as string, {
      responseType: 'blob'
    }).toPromise();

    // Convert the Blob to a base64-encoded string
    const reader = new FileReader();
    reader.readAsDataURL(hdfFileResponse!);

    const base64Content = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const base64Content = base64.split(';base64,').pop();
        if (base64Content) {
          resolve(base64Content);
        } else {
          reject('Failed to convert Blob to base64 string');
        }
      };
      reader.onerror = reject;
    });
    const base64String = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

    // Save the HDF file to the device
    const hdfFileName = 'harmonised-downloadable-file.xlsx';
    await Filesystem.writeFile({
      path: hdfFileName,
      data: base64String,
      directory: Directory.Documents,
    });
  }
}