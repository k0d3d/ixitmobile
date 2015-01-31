
package org.ixit.filechooser;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.Toast;
import android.widget.CheckBox;
import android.widget.RadioGroup;
import android.widget.TextView;

import org.apache.cordova.*;
// import org.apache.cordova.CallbackContext;
// import org.apache.cordova.CordovaPlugin;
// import org.apache.cordova.PluginResult;
import org.json.JSONException;

import android.content.Context;

import ru.bartwell.exfilepicker.ExFilePicker;
import ru.bartwell.exfilepicker.ExFilePickerParcelObject;

/**
 * @author koded
 */
public class IXITFileChooser extends CordovaPlugin {

    private static final String TAG = "IXITFileChooser";

    private static final int EX_FILE_PICKER_RESULT = 0;

    private static final int REQUEST_CODE = 6384; // onActivityResult request
                                                  // code
    private static final String ACTION_OPEN = "openChooser";


    CallbackContext callback;

    @Override
    public boolean execute(String action, CordovaArgs args, CallbackContext callbackContext) throws JSONException {



        if (action.equals(ACTION_OPEN)) {
            cordova.getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {

                    Context context = cordova.getActivity().getApplicationContext();
                    Intent intent = new Intent(context, ru.bartwell.exfilepicker.ExFilePickerActivity.class);
                    cordova.getActivity().startActivityForResult(intent, EX_FILE_PICKER_RESULT);
                }
            });
            // chooseFile(callbackContext);
            return true;
        }

        return false;
    }


    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == EX_FILE_PICKER_RESULT) {
            if (data != null) {
                ExFilePickerParcelObject object = (ExFilePickerParcelObject) data.getParcelableExtra(ExFilePickerParcelObject.class.getCanonicalName());
                if (object.count > 0) {
                    // Here is object contains selected files names and path
                }
            }
        }
    }

}
