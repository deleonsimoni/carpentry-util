import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '@app/shared/services';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { NgxImageCompressService } from 'ngx-image-compress';
import { DomSanitizer } from '@angular/platform-browser';
import { ImagePathUrlPipe } from '@app/shared/pipes/image-path-url.pipe';

@Component({
  selector: 'app-profile-user',
  templateUrl: './profile-user.component.html',
  styleUrls: ['./profile-user.component.scss'],
})
export class ProfileUserComponent implements OnInit {
  public userForm: FormGroup;
  user;
  profilePic;
  profilePicName;
  urlImage;
  constructor(
    private builder: FormBuilder,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private imageCompress: NgxImageCompressService,
    private sanitizer: DomSanitizer,
    private imagePathUrlPipe: ImagePathUrlPipe
  ) {
    this.createForm();
  }

  ngOnInit() {
    this.authService.me().subscribe(user => {
      this.user = user;

      this.urlImage = this.sanitizer.bypassSecurityTrustStyle(
        'url(' + this.imagePathUrlPipe.transform(user.image) + ')'
      );
      this.userForm.patchValue(user);
    });
  }

  public loadImage() {
    let element: HTMLElement = document.getElementById(
      'miniature'
    ) as HTMLElement;
    element.click();
  }

  public setMiniature(files: FileList): void {
    this.profilePic = files;

    const reader = new FileReader();
    reader.readAsDataURL(this.profilePic[0]); // Read file as data url
    reader.onloadend = (e: any) => {
      // function call once readAsDataUrl is completed

      var orientation = -1;
      this.imageCompress
        .compressFile(e.target['result'], orientation, 50, 50)
        .then(result => {
          this.profilePicName = this.profilePic[0].name;
          this.profilePic = result;
          (document.getElementById('imageRender') as HTMLImageElement).src =
            result;
        });
    };
  }

  save() {
    this.spinner.show();

    if (this.profilePic) {
      this.updateImageUser();
    }

    this.authService.updateUser(this.userForm.value).subscribe(
      data => {
        this.spinner.hide();

        if (!data.errors) {
          this.toastr.success('Profile Updated', 'Success');
        } else {
          this.toastr.error('Error update Profile', 'Error');
        }
      },
      err => {
        this.spinner.hide();
        this.toastr.error('Error update Profile. ', 'Erro: ');
      }
    );
  }

  updateImageUser() {
    this.spinner.show();

    this.authService
      .updateImageUser(this.profilePicName, this.profilePic)
      .subscribe(
        data => {
          this.spinner.hide();

          if (!data.errors) {
            this.toastr.success('Image Profile Updated', 'Success');
          } else {
            this.toastr.error('Error update Image Profile', 'Error');
          }
        },
        err => {
          this.spinner.hide();
          this.toastr.error('Error update Image Profile. ', 'Erro: ');
        }
      );
  }

  private createForm(): void {
    this.userForm = this.builder.group({
      email: [{ value: '', disabled: true }, Validators.required],
      fullname: [null, [Validators.required]],
      image: [null],
      mobilePhone: [null],
      homePhone: [null],
      address: this.builder.group({
        street: [null],
        city: [null],
        country: [null],
        postalCode: [null],
      }),
      socialMedia: this.builder.group({
        facebook: [null],
        youtube: [null],
        instagram: [null],
        website: [null],
      }),
    });
  }
}
